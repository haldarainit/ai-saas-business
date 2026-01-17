import cron, { ScheduledTask } from "node-cron";
import EmailService from "./EmailService";
import CampaignStorage from "./CampaignStorage";
import mongoose from "mongoose";

// Types for campaign data
interface Recipient {
    email: string;
    name?: string;
    sent: boolean;
    sentAt?: Date | null;
    error?: string;
}

interface CSVData {
    headers?: string[];
    data?: Record<string, string>[];
    totalRows?: number;
}

interface CampaignSettings {
    batchSize?: number;
    delay?: number;
    maxRetries?: number;
}

interface CampaignData {
    _id?: mongoose.Types.ObjectId | string;
    _doc?: Record<string, unknown>;
    userId?: string;
    subject?: string;
    template?: string;
    recipients?: Recipient[];
    status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
    totalEmails?: number;
    sentCount?: number;
    failedCount?: number;
    currentIndex?: number;
    settings?: CampaignSettings;
    csvData?: CSVData;
    enabledColumns?: string[];
    ctaUrl?: string | null;
    ctaText?: string | null;
    actualStartTime?: Date;
    pausedAt?: Date;
    completedAt?: Date;
    updatedAt?: Date;
    createdAt?: Date;
}

interface CampaignStartData {
    emails: string[];
    subject: string;
    content?: string;
    csvData?: CSVData;
    enabledColumns?: string[];
    template?: string;
    ctaUrl?: string;
    ctaText?: string;
}

interface CampaignUpdateData {
    emails?: string[];
    subject?: string;
    content?: string;
    csvData?: CSVData;
    enabledColumns?: string[];
    template?: string;
    forceNew?: boolean;
}

// Result types
interface OperationResult {
    success: boolean;
    message?: string;
    error?: string;
    campaignId?: string;
    resumed?: boolean;
    currentIndex?: number;
    remainingEmails?: number;
    updatedCampaign?: CampaignData;
    data?: CampaignData | null;
    deletedCount?: number;
    deletedCampaigns?: number;
    deletedLogs?: number;
}

interface CampaignStatusResult {
    success: boolean;
    data?: {
        campaign: CampaignData | null;
        emailLog: unknown[];
        todaysCount: number;
        isRunning: boolean;
        maxEmailsPerDay: number;
        dailyLimitReached: boolean;
    };
    error?: string;
}

class CampaignScheduler {
    private emailService: EmailService | null;
    private storage: CampaignStorage;
    private userId: string | null;
    private cronJob: ScheduledTask | null;
    private processingInterval: ReturnType<typeof setInterval> | null;
    private isRunning: boolean;
    private isProcessing: boolean;
    private maxEmailsPerDay: number;
    private emailIntervalMinutes: number;
    private currentCampaignId: mongoose.Types.ObjectId | string | null;
    private enableInternalCron: boolean;

    constructor(userId: string | null = null) {
        this.emailService = null;
        this.storage = new CampaignStorage(userId);
        this.userId = userId;
        this.cronJob = null;
        this.processingInterval = null;
        this.isRunning = false;
        this.isProcessing = false;
        this.maxEmailsPerDay = 50;
        this.emailIntervalMinutes = 1;
        this.currentCampaignId = null;
        this.enableInternalCron =
            String(process.env.ENABLE_INTERNAL_CRON || "").toLowerCase() === "true";

        this.init();
    }

    /**
     * Initialize or reinitialize the email service with user-specific settings
     */
    async initEmailService(): Promise<EmailService> {
        if (this.userId) {
            this.emailService = await EmailService.createForUser(this.userId);
            console.log(`📧 EmailService configured for user: ${this.userId}`);
        } else {
            this.emailService = new EmailService();
            console.log("📧 EmailService using default configuration");
        }
        return this.emailService;
    }

    async init(): Promise<void> {
        if (!this.enableInternalCron) {
            return;
        }

        const campaignResult = await this.storage.loadCampaign();
        if (
            campaignResult.success &&
            campaignResult.data &&
            campaignResult.data.status === "active"
        ) {
            console.log("Resuming active campaign from storage...");
            this.currentCampaignId = campaignResult.data._id || null;
            await this.resumeCampaign();
        }
    }

    async startCampaign(campaignData: CampaignStartData): Promise<OperationResult> {
        try {
            const {
                emails,
                subject,
                content,
                csvData,
                enabledColumns,
                template,
                ctaUrl,
                ctaText,
            } = campaignData;

            console.log("🚀 Starting campaign with data:", {
                emailsCount: emails?.length || 0,
                subject,
                hasTemplate: !!template,
                hasContent: !!content,
                hasCsvData: !!csvData,
                csvDataSize: csvData?.data?.length || 0,
                csvHeaders: csvData?.headers || [],
                enabledColumnsCount: enabledColumns?.length || 0,
                enabledColumns: enabledColumns || [],
                hasCTA: !!(ctaUrl && ctaText),
            });

            if (csvData) {
                console.log("📊 CSV Data details:", {
                    headers: csvData.headers,
                    firstRow: csvData.data?.[0] || {},
                    totalRows: csvData.totalRows,
                });
            }

            if (!emails || emails.length === 0) {
                return { success: false, error: "No recipients provided" };
            }

            const existingCampaignResult = await this.storage.loadCampaign();

            if (existingCampaignResult.success && existingCampaignResult.data) {
                const existingCampaign = existingCampaignResult.data;

                if (existingCampaign.status === "active") {
                    console.log("Campaign is already active and running");
                    return {
                        success: true,
                        message: "Campaign is already running",
                        campaignId: existingCampaign._id?.toString(),
                        resumed: false,
                    };
                }

                if (existingCampaign.status === "paused") {
                    const recipients = emails.map((email) => {
                        const existingRecipient = existingCampaign.recipients?.find(
                            (r) => r.email && r.email.toLowerCase() === email.toLowerCase()
                        );

                        let recipientData: Recipient = {
                            email,
                            sent: existingRecipient?.sent || false,
                            sentAt: existingRecipient?.sentAt || null,
                        };

                        if (csvData && csvData.data) {
                            const csvRow = csvData.data.find(
                                (row) =>
                                    row.email && row.email.toLowerCase() === email.toLowerCase()
                            );
                            if (csvRow && csvRow.name) {
                                recipientData.name = csvRow.name;
                            }
                        }

                        return recipientData;
                    });

                    const updatedCampaign = {
                        ...existingCampaign._doc,
                        subject,
                        template: template || content,
                        recipients,
                        totalEmails: emails.length,
                        status: "active" as const,
                        actualStartTime: new Date(),
                        csvData,
                        enabledColumns: enabledColumns || [],
                        ctaUrl: ctaUrl || existingCampaign.ctaUrl || null,
                        ctaText: ctaText || existingCampaign.ctaText || null,
                    };

                    const saveResult = await this.storage.saveCampaign(updatedCampaign as CampaignData);
                    if (!saveResult.success) {
                        return { success: false, error: "Failed to save campaign" };
                    }

                    this.currentCampaignId = existingCampaign._id || null;

                    const campaignUserId = saveResult.data?.userId || this.userId;
                    if (campaignUserId) {
                        await this.storage.initializeCampaignLogs(
                            existingCampaign._id!,
                            recipients,
                            subject,
                            campaignUserId
                        );
                    }

                    await this.startCronJob();

                    console.log(
                        `Campaign resumed from email ${(existingCampaign.currentIndex || 0) + 1}/${emails.length}`
                    );
                    return {
                        success: true,
                        message: `Campaign resumed from email ${(existingCampaign.currentIndex || 0) + 1}`,
                        campaignId: existingCampaign._id?.toString(),
                        resumed: true,
                    };
                }

                if (existingCampaign.status === "draft") {
                    console.log("Activating existing draft campaign...");

                    const recipients = emails.map((email) => {
                        let recipientData: Recipient = { email, sent: false };
                        if (csvData && csvData.data) {
                            const csvRow = csvData.data.find(
                                (row) =>
                                    row.email && row.email.toLowerCase() === email.toLowerCase()
                            );
                            if (csvRow && csvRow.name) {
                                recipientData.name = csvRow.name;
                            }
                        }
                        return recipientData;
                    });

                    const updatedCampaign = {
                        ...existingCampaign._doc,
                        subject,
                        template: template || content,
                        recipients,
                        totalEmails: emails.length,
                        status: "active" as const,
                        actualStartTime: new Date(),
                        csvData,
                        enabledColumns: enabledColumns || [],
                        ctaUrl: ctaUrl || null,
                        ctaText: ctaText || null,
                        sentCount: 0,
                        failedCount: 0,
                        currentIndex: 0
                    };

                    const saveResult = await this.storage.saveCampaign(updatedCampaign as CampaignData);
                    if (!saveResult.success) {
                        return { success: false, error: "Failed to activate draft campaign" };
                    }

                    this.currentCampaignId = existingCampaign._id || null;

                    const campaignUserId = saveResult.data?.userId || this.userId;
                    if (campaignUserId) {
                        await this.storage.initializeCampaignLogs(
                            existingCampaign._id!,
                            recipients,
                            subject,
                            campaignUserId
                        );
                    }

                    await this.startCronJob();

                    return {
                        success: true,
                        message: "Campaign started successfully",
                        campaignId: existingCampaign._id?.toString(),
                        resumed: false,
                    };
                }
            }

            // Create new campaign
            const recipients = emails.map((email) => {
                let recipientData: Recipient = { email, sent: false };

                if (csvData && csvData.data) {
                    const csvRow = csvData.data.find(
                        (row) =>
                            row.email && row.email.toLowerCase() === email.toLowerCase()
                    );
                    if (csvRow && csvRow.name) {
                        recipientData.name = csvRow.name;
                    }
                }

                return recipientData;
            });

            const campaign: CampaignData = {
                subject,
                template: template || content,
                recipients,
                status: "active",
                totalEmails: emails.length,
                sentCount: 0,
                failedCount: 0,
                currentIndex: 0,
                actualStartTime: new Date(),
                settings: {
                    batchSize: 10,
                    delay: 6000,
                    maxRetries: 3,
                },
                csvData,
                enabledColumns: enabledColumns || [],
                ctaUrl: ctaUrl || null,
                ctaText: ctaText || null,
            };

            const saveResult = await this.storage.saveCampaign(campaign);
            if (!saveResult.success) {
                return { success: false, error: "Failed to save campaign" };
            }

            this.currentCampaignId = saveResult.data?._id || null;

            const campaignUserId = saveResult.data?.userId || this.userId;
            if (campaignUserId && saveResult.data?._id) {
                await this.storage.initializeCampaignLogs(
                    saveResult.data._id,
                    recipients,
                    subject,
                    campaignUserId
                );
            }

            await this.startCronJob();

            console.log(`New campaign started with ${emails.length} recipients`);
            return {
                success: true,
                message: "Campaign started successfully",
                campaignId: saveResult.data?._id?.toString(),
                resumed: false,
            };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to start campaign:", error);
            return { success: false, error: err.message };
        }
    }

    async resumeCampaign(): Promise<OperationResult> {
        try {
            const campaignResult = await this.storage.loadCampaign();
            if (!campaignResult.success || !campaignResult.data) {
                return { success: false, error: "No campaign to resume" };
            }

            const campaign = campaignResult.data;

            if (campaign.status === "active" && this.isRunning) {
                return { success: true, message: "Campaign is already running" };
            }

            const updateResult = await this.storage.updateCampaignStatus(
                campaign._id!,
                "active",
                { actualStartTime: new Date() }
            );

            if (!updateResult.success) {
                return { success: false, error: "Failed to save resumed campaign" };
            }

            this.currentCampaignId = campaign._id || null;

            const campaignUserId = campaign.userId || this.userId;
            if (campaignUserId && campaign.recipients && campaign.recipients.length > 0) {
                await this.storage.initializeCampaignLogs(
                    campaign._id!,
                    campaign.recipients,
                    campaign.subject || "",
                    campaignUserId
                );
            }

            await this.startCronJob();

            const currentIndex = campaign.currentIndex || 0;
            const remainingEmails = (campaign.recipients?.length || 0) - currentIndex;

            console.log(
                `Campaign resumed from email ${currentIndex + 1}/${campaign.recipients?.length || 0} (${remainingEmails} remaining)`
            );
            return {
                success: true,
                message: `Campaign resumed from email ${currentIndex + 1}. ${remainingEmails} emails remaining.`,
                currentIndex: currentIndex,
                remainingEmails: remainingEmails,
            };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to resume campaign:", error);
            return { success: false, error: err.message };
        }
    }

    async stopCampaign(): Promise<OperationResult> {
        try {
            if (this.cronJob) {
                this.cronJob.stop();
                this.cronJob = null;
            }

            if (this.processingInterval) {
                clearInterval(this.processingInterval);
                this.processingInterval = null;
            }

            this.isRunning = false;
            this.isProcessing = false;

            if (this.currentCampaignId) {
                await this.storage.updateCampaignStatus(
                    this.currentCampaignId,
                    "paused",
                    { pausedAt: new Date() }
                );
            }

            console.log("Campaign stopped");
            return { success: true, message: "Campaign stopped successfully" };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to stop campaign:", error);
            return { success: false, error: err.message };
        }
    }

    async resetCampaign(): Promise<OperationResult> {
        try {
            await this.stopCampaign();

            let campaignToHandle = this.currentCampaignId;
            let campaignData: CampaignData | null = null;

            if (!campaignToHandle) {
                const campaignResult = await this.storage.loadCampaign();
                if (campaignResult.success && campaignResult.data) {
                    campaignToHandle = campaignResult.data._id || null;
                    campaignData = campaignResult.data;
                }
            } else {
                const campaignResult = await this.storage.getCampaignById(campaignToHandle);
                if (campaignResult.success) {
                    campaignData = campaignResult.data || null;
                }
            }

            if (campaignToHandle && campaignData) {
                if ((campaignData.sentCount || 0) > 0) {
                    console.log("📊 Campaign has sent emails - marking as completed to preserve history");
                    await this.storage.updateCampaignStatus(
                        campaignToHandle,
                        "completed",
                        { completedAt: new Date() }
                    );
                } else {
                    console.log("🗑️ Deleting empty campaign:", campaignToHandle);
                    await this.storage.deleteCampaign(campaignToHandle);
                    await this.storage.forceDeleteCampaignLogs(campaignToHandle);
                }
                this.currentCampaignId = null;
            }

            console.log("✅ Campaign reset completed");
            return { success: true, message: "Campaign reset successfully" };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to reset campaign:", error);
            return { success: false, error: err.message };
        }
    }

    async startCronJob(): Promise<void> {
        if (!this.enableInternalCron) {
            this.isRunning = true;
            console.log(
                "Internal cron disabled; using setInterval for continuous email processing"
            );

            if (this.processingInterval) {
                clearInterval(this.processingInterval);
            }

            await this.processNextEmail();

            this.processingInterval = setInterval(async () => {
                if (this.isRunning) {
                    await this.processNextEmail();
                }
            }, 60000);

            return;
        }

        if (this.cronJob) {
            this.cronJob.stop();
        }

        this.cronJob = cron.schedule(
            "* * * * *",
            async () => {
                await this.processNextEmail();
            }
        );

        this.cronJob.start();
        this.isRunning = true;
        console.log("Cron job started - emails will be sent every minute");
    }

    async processNextEmail(): Promise<void> {
        if (this.isProcessing) {
            console.log("⚠️ Email processing already in progress, skipping...");
            return;
        }

        this.isProcessing = true;

        try {
            if (!this.emailService) {
                await this.initEmailService();
            }

            const todaysCountResult = await this.storage.getTodaysSentCount();
            if (!todaysCountResult.success) {
                console.error("Failed to get today's count:", todaysCountResult.error);
                return;
            }

            if ((todaysCountResult.count || 0) >= this.maxEmailsPerDay) {
                console.log(
                    `Daily limit of ${this.maxEmailsPerDay} emails reached. Waiting for tomorrow...`
                );
                return;
            }

            const campaignResult = await this.storage.loadCampaign({ lean: true });
            if (
                !campaignResult.success ||
                !campaignResult.data ||
                campaignResult.data.status !== "active"
            ) {
                console.log("No active campaign found");
                await this.stopCampaign();
                return;
            }

            const campaignId = campaignResult.data._id;
            const currentIndex = campaignResult.data.currentIndex || 0;
            const totalEmails = campaignResult.data.totalEmails || 0;

            if (currentIndex >= totalEmails) {
                console.log("Campaign completed - all emails sent");
                await this.completeCampaign();
                return;
            }

            const recipientResult = await this.storage.loadCampaignRecipient(campaignId!, currentIndex);

            if (!recipientResult.success || !recipientResult.data) {
                console.error("Failed to load recipient at index:", currentIndex, recipientResult.error);
                await this.storage.updateCampaignProgress(
                    campaignId!,
                    campaignResult.data.sentCount || 0,
                    currentIndex + 1,
                    (campaignResult.data.failedCount || 0) + 1
                );
                return;
            }

            const campaign = recipientResult.data;
            const recipient = recipientResult.recipient;

            const campaignUserId = campaign.userId || this.userId;

            if (!campaignUserId) {
                console.error("⚠️ WARNING: campaignUserId is null/undefined!", {
                    "campaign.userId": campaign.userId,
                    "this.userId": this.userId,
                    campaignId: campaign._id
                });
            }

            if (!recipient) {
                console.error(`No recipient found at index ${currentIndex}`);
                await this.storage.updateCampaignProgress(
                    campaignId!,
                    campaign.sentCount || 0,
                    currentIndex + 1,
                    (campaign.failedCount || 0) + 1
                );
                return;
            }

            const recipientEmail = recipient.email;

            if (recipient.sent) {
                console.log(`Email already sent to ${recipientEmail}, skipping...`);
                await this.storage.updateCampaignProgress(
                    campaign._id!,
                    campaign.sentCount || 0,
                    currentIndex + 1,
                    campaign.failedCount || 0
                );
                return;
            }

            let recipientData: Record<string, string> = {};
            if (campaign.csvData && campaign.csvData.data) {
                const recipientRow = campaign.csvData.data.find(
                    (row) =>
                        row.email &&
                        row.email.toLowerCase() === recipientEmail.toLowerCase()
                );
                if (recipientRow) {
                    recipientData = recipientRow;
                }
            }

            let personalizedSubject = campaign.subject || "";
            let personalizedContent = campaign.template || "";

            if (
                Object.keys(recipientData).length > 0 &&
                campaign.enabledColumns &&
                campaign.enabledColumns.length > 0
            ) {
                campaign.enabledColumns.forEach((column) => {
                    if (recipientData[column]) {
                        const value = recipientData[column];
                        const regex = new RegExp(`{{${column}}}`, "gi");
                        personalizedSubject = personalizedSubject.replace(regex, value);
                        personalizedContent = personalizedContent.replace(regex, value);
                    }
                });
            }

            console.log(
                `Sending email ${currentIndex + 1}/${campaign.totalEmails} to: ${recipientEmail}`
            );

            const result = await this.emailService!.sendEmail(
                recipientEmail,
                personalizedSubject,
                personalizedContent,
                null,
                {
                    enableTracking: true,
                    campaignId: campaign._id?.toString(),
                    userId: campaignUserId || undefined,
                    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
                    ctaUrl: campaign.ctaUrl || undefined,
                    ctaText: campaign.ctaText || undefined,
                }
            );

            await this.storage.logEmailSent({
                campaignId: campaign._id!,
                recipientEmail: recipientEmail,
                recipientName: recipient.name,
                subject: personalizedSubject,
                status: result.success ? "sent" : "failed",
                sentAt: new Date(),
                error: result.error || undefined,
                userId: campaignUserId || undefined,
                deliveryDetails: {
                    messageId: result.messageId,
                    provider: "resend",
                    attempt: 1,
                },
            });

            await this.storage.updateRecipientStatus(
                campaign._id!,
                recipientEmail,
                result.success ? "sent" : "failed",
                result.error || null
            );

            const newSentCount = result.success
                ? (campaign.sentCount || 0) + 1
                : campaign.sentCount || 0;
            const newFailedCount = result.success
                ? campaign.failedCount || 0
                : (campaign.failedCount || 0) + 1;

            await this.storage.updateCampaignProgress(
                campaign._id!,
                newSentCount,
                currentIndex + 1,
                newFailedCount
            );

            if (currentIndex + 1 >= (campaign.totalEmails || 0)) {
                console.log("🎉 All emails processed - completing campaign");
                this.currentCampaignId = campaign._id || null;
                await this.completeCampaign();
            }

            if (result.success) {
                console.log(`✓ Email sent successfully to ${recipientEmail}`);
            } else {
                console.error(
                    `✗ Failed to send email to ${recipientEmail}:`,
                    result.error
                );
            }
        } catch (error) {
            console.error("Error processing email:", error);
        } finally {
            this.isProcessing = false;
        }
    }

    async completeCampaign(): Promise<OperationResult> {
        try {
            let campaignId = this.currentCampaignId;
            let campaignData: CampaignData | null = null;

            if (!campaignId) {
                const campaignResult = await this.storage.loadCampaign();
                if (campaignResult.success && campaignResult.data) {
                    campaignId = campaignResult.data._id || null;
                    campaignData = campaignResult.data;
                }
            } else {
                const campaignResult = await this.storage.getCampaignById(campaignId);
                if (campaignResult.success && campaignResult.data) {
                    campaignData = campaignResult.data;
                }
            }

            if (campaignId) {
                const finalSentCount = campaignData?.sentCount || 0;
                await this.storage.updateCampaignStatus(
                    campaignId,
                    "completed",
                    {
                        completedAt: new Date(),
                        totalEmails: finalSentCount,
                    }
                );
                console.log("✅ Campaign marked as completed:", campaignId, "with", finalSentCount, "emails");
            }

            await this.stopCampaign();
            console.log("Campaign completed successfully");
            return { success: true, message: "Campaign completed" };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to complete campaign:", error);
            return { success: false, error: err.message };
        }
    }

    async updateCampaignEmails(newEmails: string[]): Promise<OperationResult> {
        try {
            const campaignResult = await this.storage.loadCampaign();
            if (!campaignResult.success || !campaignResult.data) {
                return { success: false, error: "No campaign found to update" };
            }

            const campaign = campaignResult.data;
            const currentIndex = campaign.currentIndex || 0;

            if (newEmails.length < currentIndex) {
                return {
                    success: false,
                    error: "Cannot remove emails that have already been sent",
                };
            }

            const recipients: Recipient[] = newEmails.map((email) => ({
                email,
                sent: false,
            }));

            const updatedCampaign = {
                ...campaign._doc,
                recipients,
                totalEmails: newEmails.length,
            };

            const saveResult = await this.storage.saveCampaign(updatedCampaign as CampaignData);
            if (!saveResult.success) {
                return { success: false, error: "Failed to save updated campaign" };
            }

            console.log(`Campaign emails updated: ${newEmails.length} recipients`);
            return {
                success: true,
                message: "Campaign emails updated successfully",
                updatedCampaign: saveResult.data,
            };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to update campaign emails:", error);
            return { success: false, error: err.message };
        }
    }

    async getCampaignStatus(): Promise<CampaignStatusResult> {
        try {
            const campaignResult = await this.storage.loadCampaign();
            const logResult = await this.storage.getEmailLog(this.currentCampaignId);
            const todaysCountResult = await this.storage.getTodaysSentCount();

            if (!campaignResult.success) {
                return { success: false, error: "Failed to load campaign" };
            }

            const campaign = campaignResult.data || null;
            const emailLog = logResult.success ? (logResult.data as unknown[]) : [];
            const todaysCount = todaysCountResult.success
                ? todaysCountResult.count || 0
                : 0;

            return {
                success: true,
                data: {
                    campaign,
                    emailLog,
                    todaysCount,
                    isRunning: this.isRunning,
                    maxEmailsPerDay: this.maxEmailsPerDay,
                    dailyLimitReached: todaysCount >= this.maxEmailsPerDay,
                },
            };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to get campaign status:", error);
            return { success: false, error: err.message };
        }
    }

    async deleteAllCampaigns(): Promise<OperationResult> {
        try {
            await this.stopCampaign();

            const result = await this.storage.deleteAllCampaigns();
            this.currentCampaignId = null;

            console.log(`All campaigns deleted: ${result.deletedCount} campaigns`);
            return {
                success: true,
                message: `${result.deletedCount} campaigns deleted successfully`,
                deletedCount: result.deletedCount,
            };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to delete all campaigns:", error);
            return { success: false, error: err.message };
        }
    }

    async clearAllLogs(): Promise<OperationResult> {
        try {
            const result = await this.storage.clearAllLogs();

            console.log(`All email logs cleared: ${result.deletedCount} logs`);
            return {
                success: true,
                message: `${result.deletedCount} email logs cleared successfully`,
                deletedCount: result.deletedCount,
            };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to clear all logs:", error);
            return { success: false, error: err.message };
        }
    }

    async clearAll(): Promise<OperationResult> {
        try {
            await this.stopCampaign();

            const campaignResult = await this.storage.deleteAllCampaigns();
            const logResult = await this.storage.forceDeleteAllLogs();

            this.currentCampaignId = null;

            console.log(
                `✅ All data cleared: ${campaignResult.deletedCount} campaigns, ${logResult.deletedCount} logs`
            );
            return {
                success: true,
                message: `Cleared ${campaignResult.deletedCount} campaigns and ${logResult.deletedCount} email logs`,
                deletedCampaigns: campaignResult.deletedCount,
                deletedLogs: logResult.deletedCount,
            };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to clear all data:", error);
            return { success: false, error: err.message };
        }
    }

    async updateCampaignData(campaignData: CampaignUpdateData): Promise<OperationResult> {
        try {
            const { emails, subject, content, csvData, enabledColumns, template, forceNew } =
                campaignData;

            console.log("🔄 Updating campaign data:", {
                emailsCount: emails?.length || 0,
                subject,
                hasTemplate: !!(template || content),
                hasCsvData: !!csvData,
                csvDataSize: csvData?.data?.length || 0,
                csvHeaders: csvData?.headers || [],
                enabledColumnsCount: enabledColumns?.length || 0,
                enabledColumns: enabledColumns || [],
                forceNew: !!forceNew,
            });

            if (!emails || emails.length === 0) {
                console.log("⚠️ No emails provided - not creating/updating campaign");

                const existingCampaignResult = await this.storage.loadCampaign();
                if (existingCampaignResult.success && existingCampaignResult.data) {
                    return {
                        success: true,
                        message: "No emails provided and existing campaign found",
                        campaignId: existingCampaignResult.data._id?.toString(),
                        data: existingCampaignResult.data,
                    };
                }

                console.log("⚠️ No emails provided and no existing campaign - not creating empty campaign");
                return {
                    success: true,
                    message: "No campaign data to save",
                    data: null,
                };
            }

            let mutableCsvData = csvData;
            if (mutableCsvData) {
                console.log("🔍 CSV data structure validation:", {
                    hasHeaders: Array.isArray(mutableCsvData.headers),
                    hasData: Array.isArray(mutableCsvData.data),
                    hasTotalRows: typeof mutableCsvData.totalRows === "number",
                    sampleRow: mutableCsvData.data?.[0] || null,
                });

                if (!mutableCsvData.headers || !mutableCsvData.data) {
                    console.warn(
                        "⚠️ CSV data is incomplete - missing headers or data array"
                    );
                }

                if (mutableCsvData.data && Array.isArray(mutableCsvData.data)) {
                    const validEmails = new Set(emails.map((e) => e.toLowerCase()));
                    const filteredData = mutableCsvData.data!.filter(
                        (row) => row.email && validEmails.has(row.email.toLowerCase())
                    );
                    mutableCsvData = {
                        ...mutableCsvData,
                        data: filteredData,
                        totalRows: filteredData.length
                    };
                    console.log(
                        `💾 Optimized CSV data: ${mutableCsvData.data.length} rows with valid emails`
                    );
                }
            }

            let existingCampaignResult = await this.storage.loadCampaign();

            if (forceNew && existingCampaignResult.success && existingCampaignResult.data) {
                const existingCampaign = existingCampaignResult.data;

                if (existingCampaign.status !== "completed") {
                    if ((existingCampaign.sentCount || 0) > 0) {
                        console.log("📊 Existing campaign has sent emails - marking as completed to preserve history");
                        await this.storage.updateCampaignStatus(
                            existingCampaign._id!,
                            "completed",
                            { completedAt: new Date() }
                        );
                    } else {
                        console.log("🆕 forceNew flag set - deleting empty draft campaign");
                        await this.storage.deleteCampaign(existingCampaign._id!);
                        await this.storage.forceDeleteCampaignLogs(existingCampaign._id!);
                    }
                    this.currentCampaignId = null;
                } else {
                    console.log("⚠️ forceNew flag set but campaign is already completed - preserving its history");
                }

                existingCampaignResult = { success: false, data: undefined };
            }

            if (existingCampaignResult.success && existingCampaignResult.data) {
                const existingCampaign = existingCampaignResult.data;

                if (existingCampaign.status === "completed") {
                    console.log(
                        "ℹ️ Latest campaign is completed. Creating a new draft for the new data."
                    );
                    existingCampaignResult = { success: false, data: undefined };
                }
            }

            if (mutableCsvData && mutableCsvData.totalRows) {
                const existingCsv = existingCampaignResult?.data?.csvData;
                const isDifferentCsv =
                    !existingCsv ||
                    existingCsv.totalRows !== mutableCsvData.totalRows ||
                    JSON.stringify(existingCsv.headers || []) !==
                    JSON.stringify(mutableCsvData.headers || []);

                if (
                    isDifferentCsv &&
                    existingCampaignResult?.data?.status !== "completed"
                ) {
                    console.log(
                        "🔄 New CSV detected – updating existing campaign recipients"
                    );

                    const recipients: Recipient[] = emails.map((email) => {
                        let recipientData: Recipient = { email, sent: false };
                        if (mutableCsvData && mutableCsvData.data) {
                            const csvRow = mutableCsvData.data.find(r => r.email && r.email.toLowerCase() === email.toLowerCase());
                            if (csvRow && csvRow.name) recipientData.name = csvRow.name;
                        }
                        return recipientData;
                    });

                    if (existingCampaignResult && existingCampaignResult.data && existingCampaignResult.data._id) {
                        await this.storage.updateDraftRecipients(
                            existingCampaignResult.data._id,
                            recipients,
                            mutableCsvData,
                            emails.length
                        );

                        existingCampaignResult = await this.storage.loadCampaign();
                    } else {
                        console.log("No existing draft found, will create new campaign");
                    }
                }
            }

            let campaign: CampaignData;
            if (existingCampaignResult.success && existingCampaignResult.data && !forceNew) {
                const existingCampaign = existingCampaignResult.data;

                const recipients: Recipient[] = (emails || []).map((email) => {
                    const existingRecipient = existingCampaign.recipients?.find(
                        (r) => r.email.toLowerCase() === email.toLowerCase()
                    );

                    let recipientData: Recipient = {
                        email,
                        sent: existingRecipient?.sent || false,
                        sentAt: existingRecipient?.sentAt || null,
                    };

                    if (mutableCsvData && mutableCsvData.data) {
                        const csvRow = mutableCsvData.data.find(
                            (row) =>
                                row.email && row.email.toLowerCase() === email.toLowerCase()
                        );
                        if (csvRow && csvRow.name) {
                            recipientData.name = csvRow.name;
                        }
                    }

                    return recipientData;
                });

                campaign = {
                    ...existingCampaign._doc,
                    subject: subject || existingCampaign.subject,
                    template: template || content || existingCampaign.template,
                    recipients,
                    totalEmails: emails?.length || existingCampaign.totalEmails,
                    csvData: mutableCsvData,
                    enabledColumns: enabledColumns || [],
                    updatedAt: new Date(),
                } as CampaignData;

                this.currentCampaignId = existingCampaign._id || null;
            } else {
                if (!emails || emails.length === 0) {
                    console.log(
                        "⚠️ No emails provided and no existing campaign - not creating empty campaign"
                    );
                    return {
                        success: true,
                        message: "No campaign to update",
                    };
                }

                const recipients: Recipient[] = (emails || []).map((email) => {
                    let recipientData: Recipient = { email, sent: false };

                    if (mutableCsvData && mutableCsvData.data) {
                        const csvRow = mutableCsvData.data.find(
                            (row) =>
                                row.email && row.email.toLowerCase() === email.toLowerCase()
                        );
                        if (csvRow && csvRow.name) {
                            recipientData.name = csvRow.name;
                        }
                    }

                    return recipientData;
                });

                campaign = {
                    subject: subject || "Email Campaign",
                    template: template || content || "<p>Your email content here...</p>",
                    recipients,
                    status: "draft",
                    totalEmails: emails?.length || 0,
                    sentCount: 0,
                    failedCount: 0,
                    currentIndex: 0,
                    settings: {
                        batchSize: 10,
                        delay: 6000,
                        maxRetries: 3,
                    },
                    csvData: mutableCsvData,
                    enabledColumns: enabledColumns || [],
                };
            }

            const saveResult = await this.storage.saveCampaign(campaign);
            if (!saveResult.success) {
                return { success: false, error: "Failed to save campaign data" };
            }

            if (!this.currentCampaignId) {
                this.currentCampaignId = saveResult.data?._id || null;
            }

            console.log(
                `✅ Campaign data updated successfully with ${campaign.recipients?.length || 0} recipients`
            );
            return {
                success: true,
                message: "Campaign data updated successfully",
                campaignId: saveResult.data?._id?.toString(),
                data: saveResult.data,
            };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to update campaign data:", error);
            return { success: false, error: err.message };
        }
    }
}

// Create a factory function to create instances with userId
export const createCampaignScheduler = (userId: string | null = null): CampaignScheduler => {
    return new CampaignScheduler(userId);
};

// Create default instance for backward compatibility
const campaignScheduler = new CampaignScheduler();

export default campaignScheduler;
