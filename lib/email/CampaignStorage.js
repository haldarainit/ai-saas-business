import dbConnect from "../mongodb";
import Campaign from "../models/Campaign";
import CampaignEmailHistory from "../models/CampaignEmailHistory";

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

  async loadCampaign(options = {}) {
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
      console.error("Failed to load campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async loadCampaignRecipient(campaignId, recipientIndex) {
    try {
      await this.ensureConnection();

      // Use projection to fetch only the specific recipient at the index
      // We also need basic campaign info like subject, template, etc.
      const campaign = await Campaign.findOne(
        {
          _id: campaignId,
          ...(this.userId && { userId: this.userId }),
        },
        {
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
          recipients: { $slice: [recipientIndex, 1] }, // Fetch only the recipient at this index
          totalEmails: 1
        }
      ).lean();

      if (!campaign) {
        return { success: false, error: "Campaign not found" };
      }

      // If recipients array is empty, it means index is out of bounds or no recipients
      if (!campaign.recipients || campaign.recipients.length === 0) {
        return { success: false, error: "Recipient not found at index" };
      }

      return { success: true, data: campaign, recipient: campaign.recipients[0] };
    } catch (error) {
      console.error("Failed to load campaign recipient:", error);
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

  async getCampaigns(limit = 20, offset = 0, status = null) {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;
      if (status && status !== 'all') {
        query.status = status;
      } else {
        // Exclude drafts that have never sent any emails (haven't been started)
        query.$or = [
          { status: { $ne: 'draft' } }, // Include all non-draft campaigns
          { status: 'draft', sentCount: { $gt: 0 } } // Include drafts that have started
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
      console.error("Failed to get campaigns:", error);
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

      console.log("📝 Logging email to history:", {
        userId: this.userId,
        campaignId: emailData.campaignId,
        recipientEmail: emailData.recipientEmail,
        status: emailData.status
      });

      // Use findOneAndUpdate with upsert to prevent duplicates
      // Only update if new status is "better" (sent > pending, failed > pending)
      const filter = {
        campaignId: emailData.campaignId,
        recipientEmail: emailData.recipientEmail.toLowerCase().trim(),
      };

      const update = {
        $set: {
          userId: this.userId,
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
        { upsert: true, new: true }
      );

      console.log("✅ Email log saved/updated successfully:", savedLog._id);
      return { success: true, data: savedLog };
    } catch (error) {
      // Handle duplicate key error gracefully
      if (error.code === 11000) {
        console.log("⚠️ Email log already exists for this campaign+recipient, updating...");
        try {
          const existingLog = await CampaignEmailHistory.findOneAndUpdate(
            {
              campaignId: emailData.campaignId,
              recipientEmail: emailData.recipientEmail.toLowerCase().trim(),
            },
            {
              $set: {
                status: emailData.status || "sent",
                sentAt: emailData.sentAt || new Date(),
                error: emailData.error || null,
                deliveryDetails: emailData.deliveryDetails,
              },
            },
            { new: true }
          );
          return { success: true, data: existingLog };
        } catch (updateError) {
          console.error("❌ Failed to update existing log:", updateError.message);
          return { success: false, error: updateError.message };
        }
      }
      console.error("❌ Failed to log email:", error.message);
      console.error("📋 Email data was:", JSON.stringify(emailData, null, 2));
      return { success: false, error: error.message };
    }
  }

  async getEmailLog(campaignId = null, limit = 100, offset = 0) {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;
      if (campaignId) query.campaignId = campaignId;

      const logs = await CampaignEmailHistory.find(query)
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

  // Initialize email logs for all recipients when campaign starts (pending status)
  async initializeCampaignLogs(campaignId, recipients, subject) {
    try {
      await this.ensureConnection();

      console.log(`📋 Initializing ${recipients.length} email logs for campaign ${campaignId}`);

      const bulkOps = recipients.map((recipient) => ({
        updateOne: {
          filter: {
            campaignId: campaignId,
            recipientEmail: recipient.email.toLowerCase().trim(),
          },
          update: {
            $setOnInsert: {
              userId: this.userId,
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
      console.error("❌ Failed to initialize campaign logs:", error.message);
      return { success: false, error: error.message };
    }
  }

  async clearLog(campaignId = null) {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;
      if (campaignId) query.campaignId = campaignId;

      // Preserve sent history: only clear non-sent entries for the scope
      const result = await CampaignEmailHistory.deleteMany({
        ...query,
        status: { $ne: "sent" },
      });
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

      const count = await CampaignEmailHistory.countDocuments(query);
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

      const stats = await CampaignEmailHistory.aggregate([
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

  // Update existing draft recipients instead of deleting
  async updateDraftRecipients(campaignId, recipients, csvData, totalEmails) {
    try {
      await this.ensureConnection();

      const result = await Campaign.updateOne(
        {
          _id: campaignId,
          status: { $in: ["draft", "paused", "active"] } // Allow updating active/paused too if needed, but mostly for draft
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

      return { success: true, modifiedCount: result.modifiedCount };
    } catch (error) {
      console.error("Failed to update draft recipients:", error);
      return { success: false, error: error.message };
    }
  }

  // Initialize email logs for all recipients with "pending" status
  async initializeCampaignLogs(campaignId, recipients, subject) {
    try {
      await this.ensureConnection();

      console.log(`📝 Initializing ${recipients.length} email logs for campaign ${campaignId}`);

      const logEntries = recipients.map(recipient => ({
        userId: this.userId,
        campaignId: campaignId,
        recipientEmail: recipient.email,
        recipientName: recipient.name || null,
        subject: subject,
        status: "pending",
        sentAt: null,
        deliveryDetails: {
          provider: "resend",
          attempt: 0,
        },
      }));

      // Use insertMany for better performance
      const result = await CampaignEmailHistory.insertMany(logEntries);
      console.log(`✅ Initialized ${result.length} email logs with pending status`);

      return { success: true, count: result.length };
    } catch (error) {
      console.error("Failed to initialize campaign logs:", error);
      return { success: false, error: error.message };
    }
  }

  // Clear all email logs for user
  async clearAllLogs() {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;

      // Preserve sent history globally; only remove non-sent transient logs
      const result = await CampaignEmailHistory.deleteMany({
        ...query,
        status: { $ne: "sent" },
      });
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Failed to clear all logs:", error);
      return { success: false, error: error.message };
    }
  }

  // Force delete ALL logs for a specific campaign (including sent)
  async forceDeleteCampaignLogs(campaignId) {
    try {
      await this.ensureConnection();

      const query = { campaignId };
      if (this.userId) query.userId = this.userId;

      const result = await CampaignEmailHistory.deleteMany(query);
      console.log(`🗑️ Force deleted ${result.deletedCount} logs for campaign ${campaignId}`);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Failed to force delete campaign logs:", error);
      return { success: false, error: error.message };
    }
  }

  // Force delete ALL logs for user (including sent) - for complete reset
  async forceDeleteAllLogs() {
    try {
      await this.ensureConnection();

      const query = {};
      if (this.userId) query.userId = this.userId;

      const result = await CampaignEmailHistory.deleteMany(query);
      console.log(`🗑️ Force deleted ${result.deletedCount} total logs`);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Failed to force delete all logs:", error);
      return { success: false, error: error.message };
    }
  }
}

export default CampaignStorage;
