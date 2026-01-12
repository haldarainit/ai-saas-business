import fs from "fs-extra";
import path from "path";
import dbConnect from "../mongodb";
import Campaign from "../models/Campaign";
import EmailLog from "../models/EmailLog";

interface OldCampaignFormat {
    emails?: string[];
    currentIndex?: number;
    lastEmailSentAt?: string;
    createdAt?: string;
    subject?: string;
    content?: string;
    template?: string;
    isActive?: boolean;
    completedAt?: string;
    stoppedAt?: string;
    totalEmails?: number;
    csvData?: unknown;
    enabledColumns?: string[];
}

interface OldLogFormat {
    recipient: string;
    subject?: string;
    success?: boolean;
    sentAt?: string;
    error?: string;
    messageId?: string;
}

interface MigrationResult {
    success: boolean;
    migratedCampaigns?: number;
    migratedLogs?: number;
    message?: string;
    error?: string;
}

interface OldDataCheckResult {
    campaignExists: boolean;
    logExists: boolean;
    hasOldData: boolean;
}

interface CleanupResult {
    success: boolean;
    message?: string;
    error?: string;
}

class DataMigrationUtil {
    private oldDataDir: string;
    private campaignFile: string;
    private logFile: string;

    constructor() {
        this.oldDataDir = path.join(process.cwd(), "data", "campaigns");
        this.campaignFile = path.join(this.oldDataDir, "active-campaign.json");
        this.logFile = path.join(this.oldDataDir, "campaign-log.json");
    }

    async migrateFromFileSystem(userId: string | null = null): Promise<MigrationResult> {
        try {
            await dbConnect();
            console.log("Connected to MongoDB for migration");

            let migratedCampaigns = 0;
            let migratedLogs = 0;

            // Check if old campaign file exists
            if (await fs.pathExists(this.campaignFile)) {
                console.log("Found old campaign file, migrating...");

                try {
                    const oldCampaign: OldCampaignFormat = await fs.readJson(this.campaignFile);
                    const migratedCampaign = this.convertCampaignFormat(oldCampaign, userId);

                    const newCampaign = new Campaign(migratedCampaign);
                    await newCampaign.save();

                    console.log("✓ Campaign migrated successfully");
                    migratedCampaigns = 1;

                    // Backup and remove old file
                    await fs.move(this.campaignFile, `${this.campaignFile}.migrated`);
                } catch (error) {
                    console.error("Failed to migrate campaign:", error);
                }
            }

            // Check if old log file exists
            if (await fs.pathExists(this.logFile)) {
                console.log("Found old log file, migrating...");

                try {
                    const oldLogs: OldLogFormat[] = await fs.readJson(this.logFile);

                    for (const log of oldLogs) {
                        const migratedLog = this.convertLogFormat(log, userId);
                        const newLog = new EmailLog(migratedLog);
                        await newLog.save();
                        migratedLogs++;
                    }

                    console.log(`✓ ${migratedLogs} email logs migrated successfully`);

                    // Backup and remove old file
                    await fs.move(this.logFile, `${this.logFile}.migrated`);
                } catch (error) {
                    console.error("Failed to migrate logs:", error);
                }
            }

            return {
                success: true,
                migratedCampaigns,
                migratedLogs,
                message: `Migration completed: ${migratedCampaigns} campaigns and ${migratedLogs} logs migrated`,
            };
        } catch (error) {
            console.error("Migration failed:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    convertCampaignFormat(oldCampaign: OldCampaignFormat, userId: string | null) {
        // Convert old format to new MongoDB format
        const recipients = (oldCampaign.emails || []).map((email, index) => ({
            email,
            sent: index < (oldCampaign.currentIndex || 0),
            sentAt:
                index < (oldCampaign.currentIndex || 0)
                    ? new Date(oldCampaign.lastEmailSentAt || oldCampaign.createdAt || Date.now())
                    : null,
        }));

        return {
            userId,
            subject: oldCampaign.subject || "Migrated Campaign",
            template: oldCampaign.content || oldCampaign.template || "",
            recipients,
            status: oldCampaign.isActive
                ? "active"
                : oldCampaign.completedAt
                    ? "completed"
                    : "paused",
            totalEmails: oldCampaign.totalEmails || (oldCampaign.emails || []).length,
            sentCount: oldCampaign.currentIndex || 0,
            failedCount: 0,
            sendingSpeed: 10,
            currentIndex: oldCampaign.currentIndex || 0,
            actualStartTime: oldCampaign.createdAt
                ? new Date(oldCampaign.createdAt)
                : new Date(),
            completedAt: oldCampaign.completedAt
                ? new Date(oldCampaign.completedAt)
                : null,
            pausedAt: oldCampaign.stoppedAt ? new Date(oldCampaign.stoppedAt) : null,
            settings: {
                batchSize: 10,
                delay: 6000,
                maxRetries: 3,
            },
            // Store original data for reference
            csvData: oldCampaign.csvData,
            enabledColumns: oldCampaign.enabledColumns || [],
        };
    }

    convertLogFormat(oldLog: OldLogFormat, userId: string | null) {
        return {
            userId,
            recipientEmail: oldLog.recipient,
            subject: oldLog.subject || "Migrated Email",
            status: oldLog.success ? "sent" : "failed",
            sentAt: new Date(oldLog.sentAt || Date.now()),
            error: oldLog.error || null,
            deliveryDetails: {
                messageId: oldLog.messageId,
                provider: "legacy",
                attempt: 1,
            },
        };
    }

    async checkOldDataExists(): Promise<OldDataCheckResult> {
        const campaignExists = await fs.pathExists(this.campaignFile);
        const logExists = await fs.pathExists(this.logFile);

        return {
            campaignExists,
            logExists,
            hasOldData: campaignExists || logExists,
        };
    }

    async cleanupOldData(): Promise<CleanupResult> {
        try {
            if (await fs.pathExists(this.oldDataDir)) {
                // Move entire old data directory to backup
                const backupDir = path.join(process.cwd(), "data", "campaigns-backup");
                await fs.move(this.oldDataDir, backupDir);
                console.log("Old data backed up to:", backupDir);
                return { success: true };
            }
            return { success: true, message: "No old data to cleanup" };
        } catch (error) {
            console.error("Cleanup failed:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
}

export default DataMigrationUtil;
export type { MigrationResult, OldDataCheckResult, CleanupResult };
