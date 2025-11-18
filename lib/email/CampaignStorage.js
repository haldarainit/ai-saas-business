import dbConnect from "../mongodb";
import Campaign from "../models/Campaign";
import EmailLog from "../models/EmailLog";

class CampaignStorage {
  constructor(userId = null) {
    this.userId = userId;
  }

  async ensureConnection() {
    try {
      await dbConnect();
      return { success: true };
    } catch (error) {
      console.error("Failed to connect to database:", error);
      return { success: false, error: error.message };
    }
  }

  async saveCampaign(campaignData) {
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
      console.error("Failed to save campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async loadCampaign() {
    try {
      await this.ensureConnection();

      // Find the most recent campaign for this user prioritizing active/paused, then draft, then completed
      let campaign = await Campaign.findOne({
        ...(this.userId && { userId: this.userId }),
        status: { $in: ["active", "paused"] },
      }).sort({ updatedAt: -1 });

      // If none active/paused, fall back to latest draft
      if (!campaign) {
        campaign = await Campaign.findOne({
          ...(this.userId && { userId: this.userId }),
          status: "draft",
        }).sort({ updatedAt: -1 });
      }

      // If still none, fall back to latest completed (for viewing purposes)
      if (!campaign) {
        campaign = await Campaign.findOne({
          ...(this.userId && { userId: this.userId }),
          status: "completed",
        }).sort({ updatedAt: -1 });
      }

      return { success: true, data: campaign };
    } catch (error) {
      console.error("Failed to load campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async getCampaignById(campaignId) {
    try {
      await this.ensureConnection();

      const campaign = await Campaign.findOne({
        _id: campaignId,
        ...(this.userId && { userId: this.userId }),
      });

      return { success: true, data: campaign };
    } catch (error) {
      console.error("Failed to get campaign by ID:", error);
      return { success: false, error: error.message };
    }
  }

  async getAllCampaigns(status = null) {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;
      if (status) query.status = status;

      const campaigns = await Campaign.find(query).sort({ updatedAt: -1 });

      return { success: true, data: campaigns };
    } catch (error) {
      console.error("Failed to get all campaigns:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteCampaign(campaignId = null) {
    try {
      await this.ensureConnection();

      if (campaignId) {
        // Delete specific campaign
        const result = await Campaign.findOneAndDelete({
          _id: campaignId,
          ...(this.userId && { userId: this.userId }),
        });
        return { success: true, data: result };
      } else {
        // Delete active campaign (for backward compatibility)
        const result = await Campaign.findOneAndDelete({
          ...(this.userId && { userId: this.userId }),
          status: { $in: ["active", "paused"] },
        });
        return { success: true, data: result };
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async updateCampaignStatus(campaignId, status, additionalData = {}) {
    try {
      await this.ensureConnection();

      const updateData = {
        status,
        ...additionalData,
        updatedAt: new Date(),
      };

      // Set timestamp fields based on status
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
      console.error("Failed to update campaign status:", error);
      return { success: false, error: error.message };
    }
  }

  async updateCampaignProgress(
    campaignId,
    sentCount,
    currentIndex,
    failedCount = 0
  ) {
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
      console.error("Failed to update campaign progress:", error);
      return { success: false, error: error.message };
    }
  }

  async updateRecipientStatus(
    campaignId,
    recipientEmail,
    status,
    error = null
  ) {
    try {
      await this.ensureConnection();

      const updateData = {
        "recipients.$.sent": status === "sent",
        "recipients.$.sentAt": status === "sent" ? new Date() : null,
        ...(error && { "recipients.$.error": error }),
      };

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
      console.error("Failed to update recipient status:", error);
      return { success: false, error: error.message };
    }
  }

  async logEmailSent(emailData) {
    try {
      await this.ensureConnection();

      const logEntry = new EmailLog({
        userId: this.userId,
        campaignId: emailData.campaignId,
        recipientEmail: emailData.recipientEmail,
        recipientName: emailData.recipientName,
        subject: emailData.subject,
        status: emailData.status || "sent",
        sentAt: emailData.sentAt || new Date(),
        error: emailData.error,
        deliveryDetails: emailData.deliveryDetails,
      });

      const savedLog = await logEntry.save();
      return { success: true, data: savedLog };
    } catch (error) {
      console.error("Failed to log email:", error);
      return { success: false, error: error.message };
    }
  }

  async getEmailLog(campaignId = null, limit = 100, offset = 0) {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;
      if (campaignId) query.campaignId = campaignId;

      const logs = await EmailLog.find(query)
        .sort({ sentAt: -1 })
        .limit(limit)
        .skip(offset)
        .populate("campaignId", "subject");

      return { success: true, data: logs };
    } catch (error) {
      console.error("Failed to get email log:", error);
      return { success: false, error: error.message };
    }
  }

  async clearLog(campaignId = null) {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;
      if (campaignId) query.campaignId = campaignId;

      const result = await EmailLog.deleteMany(query);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Failed to clear log:", error);
      return { success: false, error: error.message };
    }
  }

  async getTodaysSentCount() {
    try {
      await this.ensureConnection();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const query = {
        sentAt: {
          $gte: today,
          $lt: tomorrow,
        },
        status: "sent",
      };

      if (this.userId) query.userId = this.userId;

      const count = await EmailLog.countDocuments(query);
      return { success: true, count };
    } catch (error) {
      console.error("Failed to get today's count:", error);
      return { success: false, error: error.message };
    }
  }

  async getEmailStats(campaignId = null, days = 7) {
    try {
      await this.ensureConnection();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const matchQuery = {
        sentAt: { $gte: startDate },
      };

      if (this.userId) matchQuery.userId = this.userId;
      if (campaignId) matchQuery.campaignId = campaignId;

      const stats = await EmailLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const statsObject = {};
      stats.forEach((stat) => {
        statsObject[stat._id] = stat.count;
      });

      return { success: true, data: statsObject };
    } catch (error) {
      console.error("Failed to get email stats:", error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup old completed campaigns (optional maintenance method)
  async cleanupOldCampaigns(daysOld = 30) {
    try {
      await this.ensureConnection();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const query = {
        status: { $in: ["completed", "cancelled"] },
        updatedAt: { $lt: cutoffDate },
      };

      if (this.userId) query.userId = this.userId;

      const result = await Campaign.deleteMany(query);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Failed to cleanup old campaigns:", error);
      return { success: false, error: error.message };
    }
  }

  // Delete all campaigns for user
  async deleteAllCampaigns() {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;

      const result = await Campaign.deleteMany(query);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Failed to delete all campaigns:", error);
      return { success: false, error: error.message };
    }
  }

  // Delete only non-completed campaigns (draft, active, paused, cancelled)
  async deleteNonCompletedCampaigns() {
    try {
      await this.ensureConnection();

      const query = {
        status: { $in: ["draft", "active", "paused", "cancelled"] },
      };
      if (this.userId) query.userId = this.userId;

      const result = await Campaign.deleteMany(query);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Failed to delete non-completed campaigns:", error);
      return { success: false, error: error.message };
    }
  }

  // Clear all email logs for user
  async clearAllLogs() {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;

      const result = await EmailLog.deleteMany(query);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Failed to clear all logs:", error);
      return { success: false, error: error.message };
    }
  }
}

export default CampaignStorage;
