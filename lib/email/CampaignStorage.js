import fs from "fs-extra";
import path from "path";

class CampaignStorage {
  constructor() {
    this.dataDir = path.join(process.cwd(), "data", "campaigns");
    this.campaignFile = path.join(this.dataDir, "active-campaign.json");
    this.logFile = path.join(this.dataDir, "campaign-log.json");
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    try {
      await fs.ensureDir(this.dataDir);
    } catch (error) {
      console.error("Failed to create data directory:", error);
    }
  }

  async saveCampaign(campaignData) {
    try {
      const data = {
        ...campaignData,
        updatedAt: new Date().toISOString(),
      };
      await fs.writeJson(this.campaignFile, data, { spaces: 2 });
      return { success: true };
    } catch (error) {
      console.error("Failed to save campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async loadCampaign() {
    try {
      if (await fs.pathExists(this.campaignFile)) {
        const data = await fs.readJson(this.campaignFile);
        return { success: true, data };
      }
      return { success: true, data: null };
    } catch (error) {
      console.error("Failed to load campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteCampaign() {
    try {
      if (await fs.pathExists(this.campaignFile)) {
        await fs.remove(this.campaignFile);
      }
      return { success: true };
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async logEmailSent(emailData) {
    try {
      let log = [];
      if (await fs.pathExists(this.logFile)) {
        log = await fs.readJson(this.logFile);
      }

      log.push({
        ...emailData,
        sentAt: new Date().toISOString(),
      });

      await fs.writeJson(this.logFile, log, { spaces: 2 });
      return { success: true };
    } catch (error) {
      console.error("Failed to log email:", error);
      return { success: false, error: error.message };
    }
  }

  async getEmailLog() {
    try {
      if (await fs.pathExists(this.logFile)) {
        const log = await fs.readJson(this.logFile);
        return { success: true, data: log };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error("Failed to get email log:", error);
      return { success: false, error: error.message };
    }
  }

  async clearLog() {
    try {
      if (await fs.pathExists(this.logFile)) {
        await fs.remove(this.logFile);
      }
      return { success: true };
    } catch (error) {
      console.error("Failed to clear log:", error);
      return { success: false, error: error.message };
    }
  }

  // Get today's sent count
  async getTodaysSentCount() {
    try {
      const logResult = await this.getEmailLog();
      if (!logResult.success) return { success: false, error: logResult.error };

      const today = new Date().toDateString();
      const todaysEmails = logResult.data.filter((email) => {
        const emailDate = new Date(email.sentAt).toDateString();
        return emailDate === today;
      });

      return { success: true, count: todaysEmails.length };
    } catch (error) {
      console.error("Failed to get today's count:", error);
      return { success: false, error: error.message };
    }
  }
}

export default CampaignStorage;
