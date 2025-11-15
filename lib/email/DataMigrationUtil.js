import fs from "fs-extra";
import path from "path";
import dbConnect from "../mongodb";
import Campaign from "../models/Campaign";
import EmailLog from "../models/EmailLog";

class DataMigrationUtil {
  constructor() {
    this.oldDataDir = path.join(process.cwd(), "data", "campaigns");
    this.campaignFile = path.join(this.oldDataDir, "active-campaign.json");
    this.logFile = path.join(this.oldDataDir, "campaign-log.json");
  }

  async migrateFromFileSystem(userId = null) {
    try {
      await dbConnect();
      console.log("Connected to MongoDB for migration");

      let migratedCampaigns = 0;
      let migratedLogs = 0;

      // Check if old campaign file exists
      if (await fs.pathExists(this.campaignFile)) {
        console.log("Found old campaign file, migrating...");

        try {
          const oldCampaign = await fs.readJson(this.campaignFile);
          const migratedCampaign = this.convertCampaignFormat(
            oldCampaign,
            userId
          );

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
          const oldLogs = await fs.readJson(this.logFile);

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
        error: error.message,
      };
    }
  }

  convertCampaignFormat(oldCampaign, userId) {
    // Convert old format to new MongoDB format
    const recipients = (oldCampaign.emails || []).map((email, index) => ({
      email,
      sent: index < (oldCampaign.currentIndex || 0),
      sentAt:
        index < (oldCampaign.currentIndex || 0)
          ? new Date(oldCampaign.lastEmailSentAt || oldCampaign.createdAt)
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

  convertLogFormat(oldLog, userId) {
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

  async checkOldDataExists() {
    const campaignExists = await fs.pathExists(this.campaignFile);
    const logExists = await fs.pathExists(this.logFile);

    return {
      campaignExists,
      logExists,
      hasOldData: campaignExists || logExists,
    };
  }

  async cleanupOldData() {
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
      return { success: false, error: error.message };
    }
  }
}

export default DataMigrationUtil;
