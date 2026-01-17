import dbConnect from "../mongodb";
import Campaign from "../models/Campaign";
import CampaignEmailHistory from "../models/CampaignEmailHistory";
import mongoose from "mongoose";

// Types for campaign data
interface Recipient {
    email: string;
    name?: string;
    sent: boolean;
    sentAt?: Date | null;
    error?: string;
}

interface CampaignSettings {
    batchSize?: number;
    delay?: number;
    maxRetries?: number;
}

interface CSVData {
    headers?: string[];
    data?: Record<string, string>[];
    totalRows?: number;
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

interface DeliveryDetails {
    messageId?: string;
    provider?: string;
    attempt?: number;
}

interface EmailLogData {
    campaignId: mongoose.Types.ObjectId | string;
    recipientEmail: string;
    recipientName?: string;
    subject?: string;
    status?: 'pending' | 'sent' | 'failed';
    sentAt?: Date;
    error?: string | null;
    userId?: string;
    deliveryDetails?: DeliveryDetails;
}

// Result types
interface StorageResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

interface CountResult {
    success: boolean;
    count?: number;
    error?: string;
}

interface DeleteResult {
    success: boolean;
    deletedCount?: number;
    error?: string;
}

interface InitializeLogsResult {
    success: boolean;
    upsertedCount?: number;
    modifiedCount?: number;
    error?: string;
}

interface CampaignsResult {
    success: boolean;
    data?: CampaignData[];
    totalCount?: number;
    error?: string;
}

interface RecipientResult {
    success: boolean;
    data?: CampaignData;
    recipient?: Recipient;
    error?: string;
}

class CampaignStorage {
    private userId: string | null;

    constructor(userId: string | null = null) {
        this.userId = userId;
    }

    async ensureConnection(): Promise<StorageResult> {
        try {
            await dbConnect();
            return { success: true };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to connect to database:", error);
            return { success: false, error: err.message };
        }
    }

    async saveCampaign(campaignData: CampaignData): Promise<StorageResult<CampaignData>> {
        try {
            await this.ensureConnection();

            console.log("💾 Saving campaign to database:", {
                userId: this.userId,
                subject: campaignData.subject,
                recipientsCount: campaignData.recipients?.length || 0,
                hasCsvData: !!campaignData.csvData,
                csvDataSize: campaignData.csvData?.data?.length || 0,
                csvHeaders: campaignData.csvData?.headers || [],
                enabledColumns: campaignData.enabledColumns || [],
                enabledColumnsCount: campaignData.enabledColumns?.length || 0,
            });

            if (campaignData.csvData) {
                console.log("💾 CSV Data being saved:", {
                    headers: campaignData.csvData.headers,
                    sampleData: campaignData.csvData.data?.slice(0, 2) || [],
                    totalRows: campaignData.csvData.totalRows,
                });
            }

            const campaignDoc = {
                ...campaignData,
                userId: this.userId,
                updatedAt: new Date(),
            };

            // If campaign has an _id, update existing, otherwise create new
            if (campaignData._id) {
                const updatedCampaign = await Campaign.findByIdAndUpdate(
                    campaignData._id,
                    campaignDoc,
                    { new: true, upsert: false }
                );
                return { success: true, data: updatedCampaign };
            } else {
                const newCampaign = new Campaign(campaignDoc);
                const savedCampaign = await newCampaign.save();
                return { success: true, data: savedCampaign };
            }
        } catch (error) {
            const err = error as Error;
            console.error("Failed to save campaign:", error);
            return { success: false, error: err.message };
        }
    }

    async loadCampaign(options: { lean?: boolean } = {}): Promise<StorageResult<CampaignData>> {
        try {
            await this.ensureConnection();

            const { lean = true } = options;

            // Find the most recent campaign for this user prioritizing active/paused, then draft, then completed
            let query = Campaign.findOne({
                ...(this.userId && { userId: this.userId }),
                status: { $in: ["active", "paused"] },
            }).sort({ updatedAt: -1 });

            if (lean) query = query.lean();

            let campaign = await query;

            // If none active/paused, fall back to latest draft
            if (!campaign) {
                query = Campaign.findOne({
                    ...(this.userId && { userId: this.userId }),
                    status: "draft",
                }).sort({ updatedAt: -1 });

                if (lean) query = query.lean();
                campaign = await query;
            }

            // If still none, fall back to latest completed (for viewing purposes)
            if (!campaign) {
                query = Campaign.findOne({
                    ...(this.userId && { userId: this.userId }),
                    status: "completed",
                }).sort({ updatedAt: -1 });

                if (lean) query = query.lean();
                campaign = await query;
            }

            return { success: true, data: campaign };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to load campaign:", error);
            return { success: false, error: err.message };
        }
    }

    async loadCampaignRecipient(
        campaignId: mongoose.Types.ObjectId | string,
        recipientIndex: number
    ): Promise<RecipientResult> {
        try {
            await this.ensureConnection();

            // Use projection to fetch only the specific recipient at the index
            const campaign = await Campaign.findOne(
                {
                    _id: campaignId,
                    ...(this.userId && { userId: this.userId }),
                },
                {
                    userId: 1,
                    subject: 1,
                    template: 1,
                    status: 1,
                    sentCount: 1,
                    failedCount: 1,
                    currentIndex: 1,
                    csvData: 1,
                    enabledColumns: 1,
                    ctaUrl: 1,
                    ctaText: 1,
                    recipients: { $slice: [recipientIndex, 1] },
                    totalEmails: 1
                }
            ).lean();

            if (!campaign) {
                return { success: false, error: "Campaign not found" };
            }

            const campaignData = campaign as unknown as CampaignData;

            if (!campaignData.recipients || campaignData.recipients.length === 0) {
                return { success: false, error: "Recipient not found at index" };
            }

            return { success: true, data: campaignData, recipient: campaignData.recipients[0] };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to load campaign recipient:", error);
            return { success: false, error: err.message };
        }
    }

    async getCampaignById(campaignId: mongoose.Types.ObjectId | string): Promise<StorageResult<CampaignData>> {
        try {
            await this.ensureConnection();

            const campaign = await Campaign.findOne({
                _id: campaignId,
                ...(this.userId && { userId: this.userId }),
            });

            return { success: true, data: campaign };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to get campaign by ID:", error);
            return { success: false, error: err.message };
        }
    }

    async getAllCampaigns(status: string | null = null): Promise<StorageResult<CampaignData[]>> {
        try {
            await this.ensureConnection();

            const query: Record<string, unknown> = {};
            if (this.userId) query.userId = this.userId;
            if (status) query.status = status;

            const campaigns = await Campaign.find(query).sort({ updatedAt: -1 });

            return { success: true, data: campaigns };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to get all campaigns:", error);
            return { success: false, error: err.message };
        }
    }

    async getCampaigns(
        limit: number = 20,
        offset: number = 0,
        status: string | null = null
    ): Promise<CampaignsResult> {
        try {
            await this.ensureConnection();

            const query: Record<string, unknown> = {};
            if (this.userId) query.userId = this.userId;
            if (status && status !== 'all') {
                query.status = status;
            } else {
                query.$or = [
                    { status: { $ne: 'draft' } },
                    { status: 'draft', sentCount: { $gt: 0 } }
                ];
            }

            const [campaigns, totalCount] = await Promise.all([
                Campaign.find(query)
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .skip(offset),
                Campaign.countDocuments(query)
            ]);

            return { success: true, data: campaigns, totalCount };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to get campaigns:", error);
            return { success: false, error: err.message };
        }
    }

    async deleteCampaign(campaignId: mongoose.Types.ObjectId | string | null = null): Promise<StorageResult> {
        try {
            await this.ensureConnection();

            if (campaignId) {
                const result = await Campaign.findOneAndDelete({
                    _id: campaignId,
                    ...(this.userId && { userId: this.userId }),
                });
                return { success: true, data: result };
            } else {
                const result = await Campaign.findOneAndDelete({
                    ...(this.userId && { userId: this.userId }),
                    status: { $in: ["active", "paused"] },
                });
                return { success: true, data: result };
            }
        } catch (error) {
            const err = error as Error;
            console.error("Failed to delete campaign:", error);
            return { success: false, error: err.message };
        }
    }

    async updateCampaignStatus(
        campaignId: mongoose.Types.ObjectId | string,
        status: string,
        additionalData: Record<string, unknown> = {}
    ): Promise<StorageResult<CampaignData>> {
        try {
            await this.ensureConnection();

            const updateData: Record<string, unknown> = {
                status,
                ...additionalData,
                updatedAt: new Date(),
            };

            if (status === "active" && !additionalData.actualStartTime) {
                updateData.actualStartTime = new Date();
            } else if (status === "paused") {
                updateData.pausedAt = new Date();
            } else if (status === "completed" || status === "cancelled") {
                updateData.completedAt = new Date();
            }

            const campaign = await Campaign.findOneAndUpdate(
                {
                    _id: campaignId,
                    ...(this.userId && { userId: this.userId }),
                },
                updateData,
                { new: true }
            );

            return { success: true, data: campaign };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to update campaign status:", error);
            return { success: false, error: err.message };
        }
    }

    async updateCampaignProgress(
        campaignId: mongoose.Types.ObjectId | string,
        sentCount: number,
        currentIndex: number,
        failedCount: number = 0
    ): Promise<StorageResult<CampaignData>> {
        try {
            await this.ensureConnection();

            const campaign = await Campaign.findOneAndUpdate(
                {
                    _id: campaignId,
                    ...(this.userId && { userId: this.userId }),
                },
                {
                    sentCount,
                    currentIndex,
                    failedCount,
                    updatedAt: new Date(),
                },
                { new: true }
            );

            return { success: true, data: campaign };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to update campaign progress:", error);
            return { success: false, error: err.message };
        }
    }

    async updateRecipientStatus(
        campaignId: mongoose.Types.ObjectId | string,
        recipientEmail: string,
        status: string,
        error: string | null = null
    ): Promise<StorageResult<CampaignData>> {
        try {
            await this.ensureConnection();

            const updateData: Record<string, unknown> = {
                "recipients.$.sent": status === "sent",
                "recipients.$.sentAt": status === "sent" ? new Date() : null,
            };

            if (error) {
                updateData["recipients.$.error"] = error;
            }

            const campaign = await Campaign.findOneAndUpdate(
                {
                    _id: campaignId,
                    "recipients.email": recipientEmail,
                    ...(this.userId && { userId: this.userId }),
                },
                updateData,
                { new: true }
            );

            return { success: true, data: campaign };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to update recipient status:", error);
            return { success: false, error: err.message };
        }
    }

    async logEmailSent(emailData: EmailLogData): Promise<StorageResult> {
        try {
            await this.ensureConnection();

            let effectiveUserId = emailData.userId || this.userId;
            if (!effectiveUserId && emailData.campaignId) {
                try {
                    const owningCampaign = await Campaign.findById(emailData.campaignId).select("userId").lean() as unknown as { userId?: string } | null;
                    if (owningCampaign?.userId) {
                        effectiveUserId = owningCampaign.userId;
                    }
                } catch (_) {
                    // fallback
                }
            }

            if (!effectiveUserId) {
                console.error("❌ Cannot log email: userId could not be resolved");
                return { success: false, error: "userId is required but could not be resolved" };
            }

            console.log("📝 Logging email to history:", {
                userId: effectiveUserId,
                campaignId: emailData.campaignId,
                recipientEmail: emailData.recipientEmail,
                status: emailData.status
            });

            const filter = {
                campaignId: emailData.campaignId,
                recipientEmail: emailData.recipientEmail.toLowerCase().trim(),
            };

            const update = {
                $set: {
                    userId: effectiveUserId,
                    recipientName: emailData.recipientName,
                    subject: emailData.subject,
                    status: emailData.status || "sent",
                    sentAt: emailData.sentAt || new Date(),
                    error: emailData.error || null,
                    deliveryDetails: emailData.deliveryDetails,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            };

            const savedLog = await CampaignEmailHistory.findOneAndUpdate(
                filter,
                update,
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
            );

            console.log("✅ Email log saved/updated successfully:", savedLog._id);
            return { success: true, data: savedLog };
        } catch (error) {
            const err = error as Error & { code?: number };

            if (err.code === 11000) {
                console.log("⚠️ Email log already exists, updating...");

                let resolvedUserId = emailData.userId || this.userId;
                if (!resolvedUserId && emailData.campaignId) {
                    try {
                        const owningCampaign = await Campaign.findById(emailData.campaignId).select("userId").lean() as unknown as { userId?: string } | null;
                        if (owningCampaign?.userId) {
                            resolvedUserId = owningCampaign.userId;
                        }
                    } catch (_) {
                        // ignore
                    }
                }

                if (!resolvedUserId) {
                    return { success: false, error: "userId is required but could not be resolved" };
                }

                try {
                    const existingLog = await CampaignEmailHistory.findOneAndUpdate(
                        {
                            campaignId: emailData.campaignId,
                            recipientEmail: emailData.recipientEmail.toLowerCase().trim(),
                        },
                        {
                            $set: {
                                userId: resolvedUserId,
                                status: emailData.status || "sent",
                                sentAt: emailData.sentAt || new Date(),
                                error: emailData.error || null,
                                deliveryDetails: emailData.deliveryDetails,
                            },
                        },
                        { new: true, runValidators: true }
                    );
                    return { success: true, data: existingLog };
                } catch (updateError) {
                    const updateErr = updateError as Error;
                    console.error("❌ Failed to update existing log:", updateErr.message);
                    return { success: false, error: updateErr.message };
                }
            }

            console.error("❌ Failed to log email:", err.message);
            return { success: false, error: err.message };
        }
    }

    async getEmailLog(
        campaignId: mongoose.Types.ObjectId | string | null = null,
        limit: number = 100,
        offset: number = 0
    ): Promise<StorageResult> {
        try {
            await this.ensureConnection();

            const query: Record<string, unknown> = {};
            if (this.userId) query.userId = this.userId;
            if (campaignId) query.campaignId = campaignId;

            const logs = await CampaignEmailHistory.find(query)
                .sort({ sentAt: -1 })
                .limit(limit)
                .skip(offset)
                .populate("campaignId", "subject");

            return { success: true, data: logs };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to get email log:", error);
            return { success: false, error: err.message };
        }
    }

    async initializeCampaignLogs(
        campaignId: mongoose.Types.ObjectId | string,
        recipients: Recipient[],
        subject: string,
        userId: string | null = null
    ): Promise<InitializeLogsResult> {
        try {
            await this.ensureConnection();

            console.log(`📋 Initializing ${recipients.length} email logs for campaign ${campaignId}`);

            let effectiveUserId = userId || this.userId;
            if (!effectiveUserId && campaignId) {
                try {
                    const owningCampaign = await Campaign.findById(campaignId).select("userId").lean() as unknown as { userId?: string } | null;
                    if (owningCampaign?.userId) {
                        effectiveUserId = owningCampaign.userId;
                    }
                } catch (_) {
                    // ignore
                }
            }

            if (!effectiveUserId) {
                console.error("❌ Cannot initialize campaign logs: userId could not be resolved");
                return { success: false, error: "userId is required but could not be resolved" };
            }

            console.log(`📋 Using userId for logs: ${effectiveUserId}`);

            const bulkOps = recipients.map((recipient) => ({
                updateOne: {
                    filter: {
                        campaignId: campaignId,
                        recipientEmail: recipient.email.toLowerCase().trim(),
                    },
                    update: {
                        $set: {
                            userId: effectiveUserId,
                        },
                        $setOnInsert: {
                            campaignId: campaignId,
                            recipientEmail: recipient.email.toLowerCase().trim(),
                            recipientName: recipient.name || null,
                            subject: subject,
                            status: "pending",
                            sentAt: new Date(),
                            createdAt: new Date(),
                        },
                    },
                    upsert: true,
                },
            }));

            const result = await CampaignEmailHistory.bulkWrite(bulkOps, { ordered: false });
            console.log(`✅ Initialized logs: ${result.upsertedCount} new, ${result.modifiedCount} existing`);

            return {
                success: true,
                upsertedCount: result.upsertedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            const err = error as Error;
            console.error("❌ Failed to initialize campaign logs:", err.message);
            return { success: false, error: err.message };
        }
    }

    async clearLog(campaignId: mongoose.Types.ObjectId | string | null = null): Promise<DeleteResult> {
        try {
            await this.ensureConnection();

            const query: Record<string, unknown> = {};
            if (this.userId) query.userId = this.userId;
            if (campaignId) query.campaignId = campaignId;

            const result = await CampaignEmailHistory.deleteMany({
                ...query,
                status: { $ne: "sent" },
            });
            return { success: true, deletedCount: result.deletedCount };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to clear log:", error);
            return { success: false, error: err.message };
        }
    }

    async getTodaysSentCount(): Promise<CountResult> {
        try {
            await this.ensureConnection();

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const query: Record<string, unknown> = {
                sentAt: {
                    $gte: today,
                    $lt: tomorrow,
                },
                status: "sent",
            };

            if (this.userId) query.userId = this.userId;

            const count = await CampaignEmailHistory.countDocuments(query);
            return { success: true, count };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to get today's count:", error);
            return { success: false, error: err.message };
        }
    }

    async getEmailStats(
        campaignId: mongoose.Types.ObjectId | string | null = null,
        days: number = 7
    ): Promise<StorageResult<Record<string, number>>> {
        try {
            await this.ensureConnection();

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const matchQuery: Record<string, unknown> = {
                sentAt: { $gte: startDate },
            };

            if (this.userId) matchQuery.userId = this.userId;
            if (campaignId) matchQuery.campaignId = campaignId;

            const stats = await CampaignEmailHistory.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]);

            const statsObject: Record<string, number> = {};
            stats.forEach((stat) => {
                statsObject[stat._id] = stat.count;
            });

            return { success: true, data: statsObject };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to get email stats:", error);
            return { success: false, error: err.message };
        }
    }

    async cleanupOldCampaigns(daysOld: number = 30): Promise<DeleteResult> {
        try {
            await this.ensureConnection();

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const query: Record<string, unknown> = {
                status: { $in: ["completed", "cancelled"] },
                updatedAt: { $lt: cutoffDate },
            };

            if (this.userId) query.userId = this.userId;

            const result = await Campaign.deleteMany(query);
            return { success: true, deletedCount: result.deletedCount };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to cleanup old campaigns:", error);
            return { success: false, error: err.message };
        }
    }

    async deleteAllCampaigns(): Promise<DeleteResult> {
        try {
            await this.ensureConnection();

            const query: Record<string, unknown> = {};
            if (this.userId) query.userId = this.userId;

            const result = await Campaign.deleteMany(query);
            return { success: true, deletedCount: result.deletedCount };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to delete all campaigns:", error);
            return { success: false, error: err.message };
        }
    }

    async deleteNonCompletedCampaigns(): Promise<DeleteResult> {
        try {
            await this.ensureConnection();

            const query: Record<string, unknown> = {
                status: { $in: ["draft", "active", "paused", "cancelled"] },
            };
            if (this.userId) query.userId = this.userId;

            const result = await Campaign.deleteMany(query);
            return { success: true, deletedCount: result.deletedCount };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to delete non-completed campaigns:", error);
            return { success: false, error: err.message };
        }
    }

    async updateDraftRecipients(
        campaignId: mongoose.Types.ObjectId | string,
        recipients: Recipient[],
        csvData: CSVData | undefined,
        totalEmails: number
    ): Promise<StorageResult<{ modifiedCount: number }>> {
        try {
            await this.ensureConnection();

            const result = await Campaign.updateOne(
                {
                    _id: campaignId,
                    status: { $in: ["draft", "paused", "active"] }
                },
                {
                    $set: {
                        recipients: recipients,
                        csvData: csvData,
                        totalEmails: totalEmails,
                        updatedAt: new Date()
                    }
                }
            );

            return { success: true, data: { modifiedCount: result.modifiedCount } };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to update draft recipients:", error);
            return { success: false, error: err.message };
        }
    }

    async clearAllLogs(): Promise<DeleteResult> {
        try {
            await this.ensureConnection();

            const query: Record<string, unknown> = {};
            if (this.userId) query.userId = this.userId;

            const result = await CampaignEmailHistory.deleteMany({
                ...query,
                status: { $ne: "sent" },
            });
            return { success: true, deletedCount: result.deletedCount };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to clear all logs:", error);
            return { success: false, error: err.message };
        }
    }

    async forceDeleteCampaignLogs(campaignId: mongoose.Types.ObjectId | string): Promise<DeleteResult> {
        try {
            await this.ensureConnection();

            const query: Record<string, unknown> = { campaignId };
            if (this.userId) query.userId = this.userId;

            const result = await CampaignEmailHistory.deleteMany(query);
            console.log(`🗑️ Force deleted ${result.deletedCount} logs for campaign ${campaignId}`);
            return { success: true, deletedCount: result.deletedCount };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to force delete campaign logs:", error);
            return { success: false, error: err.message };
        }
    }

    async forceDeleteAllLogs(): Promise<DeleteResult> {
        try {
            await this.ensureConnection();

            const query: Record<string, unknown> = {};
            if (this.userId) query.userId = this.userId;

            const result = await CampaignEmailHistory.deleteMany(query);
            console.log(`🗑️ Force deleted ${result.deletedCount} total logs`);
            return { success: true, deletedCount: result.deletedCount };
        } catch (error) {
            const err = error as Error;
            console.error("Failed to force delete all logs:", error);
            return { success: false, error: err.message };
        }
    }
}

export default CampaignStorage;
