import cron from "node-cron";
import EmailService from "./EmailService.js";
import CampaignStorage from "./CampaignStorage";

class CampaignScheduler {
  constructor(userId = null) {
    this.emailService = new EmailService();
    this.storage = new CampaignStorage(userId);
    this.userId = userId;
    this.cronJob = null;
    this.isRunning = false;
    this.maxEmailsPerDay = 20;
    this.emailInterval = 1; // minutes
    this.currentCampaignId = null;
    this.enableInternalCron =
      String(process.env.ENABLE_INTERNAL_CRON || "").toLowerCase() === "true";

    // Initialize on startup
    this.init();
  }

  async init() {
    // On serverless (Vercel free), avoid auto-resume to prevent
    // unintended sends on arbitrary requests. Only resume when
    // internal cron is explicitly enabled.
    if (!this.enableInternalCron) {
      return;
    }

    // Check if there's an active campaign on startup (for long-lived envs)
    const campaignResult = await this.storage.loadCampaign();
    if (
      campaignResult.success &&
      campaignResult.data &&
      campaignResult.data.status === "active"
    ) {
      console.log("Resuming active campaign from storage...");
      this.currentCampaignId = campaignResult.data._id;
      await this.resumeCampaign();
    }
  }

  async startCampaign(campaignData) {
    try {
      const { emails, subject, content, csvData, enabledColumns, template } =
        campaignData;

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

      // Check if there's already an existing campaign (active or paused)
      const existingCampaignResult = await this.storage.loadCampaign();

      if (existingCampaignResult.success && existingCampaignResult.data) {
        const existingCampaign = existingCampaignResult.data;

        // If campaign is already active, don't create a new one - just return success
        if (existingCampaign.status === "active") {
          console.log("Campaign is already active and running");
          return {
            success: true,
            message: "Campaign is already running",
            campaignId: existingCampaign._id.toString(),
            resumed: false,
          };
        }

        // If campaign is paused, resume it
        if (existingCampaign.status === "paused") {
          // There's a paused campaign, resume it instead of creating new one
          const existingCampaign = existingCampaignResult.data;

          // Convert emails array to recipients format with CSV data, PRESERVING sent status
          const recipients = emails.map((email) => {
            // Find existing recipient to preserve sent status
            const existingRecipient = existingCampaign.recipients?.find(
              (r) => r.email && r.email.toLowerCase() === email.toLowerCase()
            );

            // Start with existing data or create new
            let recipientData = {
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

          // Update the campaign with current data but preserve the currentIndex
          const updatedCampaign = {
            ...existingCampaign._doc,
            subject,
            template: template || content,
            recipients,
            totalEmails: emails.length,
            status: "active",
            actualStartTime: new Date(),
            csvData,
            enabledColumns: enabledColumns || [],
          };

          const saveResult = await this.storage.saveCampaign(updatedCampaign);
          if (!saveResult.success) {
            return { success: false, error: "Failed to save campaign" };
          }

          this.currentCampaignId = existingCampaign._id;
          await this.startCronJob();

          console.log(
            `Campaign resumed from email ${existingCampaign.currentIndex + 1}/${
              emails.length
            }`
          );
          return {
            success: true,
            message: `Campaign resumed from email ${
              existingCampaign.currentIndex + 1
            }`,
            campaignId: existingCampaign._id.toString(),
            resumed: true,
          };
        }
      }

      // Convert emails array to recipients format with CSV data
      const recipients = emails.map((email) => {
        // Find corresponding data from CSV if available
        let recipientData = { email, sent: false };

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

      // Create new campaign
      const campaign = {
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
          delay: 6000, // 6 seconds between emails
          maxRetries: 3,
        },
        // Store additional data for template processing
        csvData,
        enabledColumns: enabledColumns || [],
      };

      const saveResult = await this.storage.saveCampaign(campaign);
      if (!saveResult.success) {
        return { success: false, error: "Failed to save campaign" };
      }

      this.currentCampaignId = saveResult.data._id;
      await this.startCronJob();

      console.log(`New campaign started with ${emails.length} recipients`);
      return {
        success: true,
        message: "Campaign started successfully",
        campaignId: saveResult.data._id.toString(),
        resumed: false,
      };
    } catch (error) {
      console.error("Failed to start campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async resumeCampaign() {
    try {
      const campaignResult = await this.storage.loadCampaign();
      if (!campaignResult.success || !campaignResult.data) {
        return { success: false, error: "No campaign to resume" };
      }

      const campaign = campaignResult.data;

      // If campaign is already active and running, just return success
      if (campaign.status === "active" && this.isRunning) {
        return { success: true, message: "Campaign is already running" };
      }

      // Reactivate the campaign
      const updateResult = await this.storage.updateCampaignStatus(
        campaign._id,
        "active",
        { actualStartTime: new Date() }
      );

      if (!updateResult.success) {
        return { success: false, error: "Failed to save resumed campaign" };
      }

      this.currentCampaignId = campaign._id;
      await this.startCronJob();

      const currentIndex = campaign.currentIndex || 0;
      const remainingEmails = campaign.recipients.length - currentIndex;

      console.log(
        `Campaign resumed from email ${currentIndex + 1}/${
          campaign.recipients.length
        } (${remainingEmails} remaining)`
      );
      return {
        success: true,
        message: `Campaign resumed from email ${
          currentIndex + 1
        }. ${remainingEmails} emails remaining.`,
        currentIndex: currentIndex,
        remainingEmails: remainingEmails,
      };
    } catch (error) {
      console.error("Failed to resume campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async stopCampaign() {
    try {
      // Stop the cron job
      if (this.cronJob) {
        this.cronJob.stop();
        this.cronJob = null;
      }

      this.isRunning = false;

      // Update campaign status
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
      console.error("Failed to stop campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async resetCampaign() {
    try {
      await this.stopCampaign();

      if (this.currentCampaignId) {
        await this.storage.deleteCampaign(this.currentCampaignId);
        await this.storage.clearLog(this.currentCampaignId);
        this.currentCampaignId = null;
      }

      console.log("Campaign reset");
      return { success: true, message: "Campaign reset successfully" };
    } catch (error) {
      console.error("Failed to reset campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async startCronJob() {
    // If internal cron is disabled (e.g., on Vercel), don't schedule.
    if (!this.enableInternalCron) {
      this.isRunning = true;
      console.log(
        "Internal cron disabled; expecting external HTTP trigger to run ticks"
      );
      // Kick one tick immediately to progress if called from UI
      await this.processNextEmail();
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
    }

    // Run every minute
    this.cronJob = cron.schedule(
      "* * * * *",
      async () => {
        await this.processNextEmail();
      },
      {
        scheduled: false,
      }
    );

    this.cronJob.start();
    this.isRunning = true;
    console.log("Cron job started - emails will be sent every minute");
  }

  async processNextEmail() {
    try {
      // Check if we've reached the daily limit
      const todaysCountResult = await this.storage.getTodaysSentCount();
      if (!todaysCountResult.success) {
        console.error("Failed to get today's count:", todaysCountResult.error);
        return;
      }

      if (todaysCountResult.count >= this.maxEmailsPerDay) {
        console.log(
          `Daily limit of ${this.maxEmailsPerDay} emails reached. Waiting for tomorrow...`
        );
        return;
      }

      // Load current campaign
      const campaignResult = await this.storage.loadCampaign();
      if (
        !campaignResult.success ||
        !campaignResult.data ||
        campaignResult.data.status !== "active"
      ) {
        console.log("No active campaign found");
        await this.stopCampaign();
        return;
      }

      const campaign = campaignResult.data;
      const { recipients, subject, template, currentIndex } = campaign;

      // Check if campaign is complete
      if (currentIndex >= recipients.length) {
        console.log("Campaign completed - all emails sent");
        await this.completeCampaign();
        return;
      }

      const recipient = recipients[currentIndex];
      const recipientEmail = recipient.email;

      // Skip if already sent
      if (recipient.sent) {
        console.log(`Email already sent to ${recipientEmail}, skipping...`);
        await this.storage.updateCampaignProgress(
          campaign._id,
          campaign.sentCount,
          currentIndex + 1,
          campaign.failedCount
        );
        return;
      }

      // Get recipient data from CSV for template variable replacement
      let recipientData = {};
      if (campaign.csvData && campaign.csvData.data) {
        // Find the row that matches this email
        const recipientRow = campaign.csvData.data.find(
          (row) =>
            row.email &&
            row.email.toLowerCase() === recipientEmail.toLowerCase()
        );
        if (recipientRow) {
          recipientData = recipientRow;
        }
      }

      // Replace template variables in subject and content (only for enabled columns)
      let personalizedSubject = subject;
      let personalizedContent = template;

      if (
        Object.keys(recipientData).length > 0 &&
        campaign.enabledColumns &&
        campaign.enabledColumns.length > 0
      ) {
        // Replace {{column_name}} with actual values only for enabled columns
        campaign.enabledColumns.forEach((column) => {
          if (recipientData[column]) {
            const value = recipientData[column];
            const regex = new RegExp(`{{${column}}}`, "gi");
            personalizedSubject = personalizedSubject.replace(regex, value);
            personalizedContent = personalizedContent.replace(regex, value);
          }
        });
      }

      // Send email
      console.log(
        `Sending email ${currentIndex + 1}/${
          recipients.length
        } to: ${recipientEmail}`
      );
      const result = await this.emailService.sendEmail(
        recipientEmail,
        personalizedSubject,
        personalizedContent
      );

      // Log the email attempt
      await this.storage.logEmailSent({
        campaignId: campaign._id,
        recipientEmail: recipientEmail,
        recipientName: recipient.name,
        subject: personalizedSubject,
        status: result.success ? "sent" : "failed",
        sentAt: new Date(),
        error: result.error,
        deliveryDetails: {
          messageId: result.messageId,
          provider: "resend", // or whatever email service you're using
          attempt: 1,
        },
      });

      // Update recipient status in campaign
      await this.storage.updateRecipientStatus(
        campaign._id,
        recipientEmail,
        result.success ? "sent" : "failed",
        result.error
      );

      // Update campaign progress
      const newSentCount = result.success
        ? campaign.sentCount + 1
        : campaign.sentCount;
      const newFailedCount = result.success
        ? campaign.failedCount
        : campaign.failedCount + 1;

      await this.storage.updateCampaignProgress(
        campaign._id,
        newSentCount,
        currentIndex + 1,
        newFailedCount
      );

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
    }
  }

  async completeCampaign() {
    try {
      if (this.currentCampaignId) {
        await this.storage.updateCampaignStatus(
          this.currentCampaignId,
          "completed",
          { completedAt: new Date() }
        );
      }

      await this.stopCampaign();
      console.log("Campaign completed successfully");
      return { success: true, message: "Campaign completed" };
    } catch (error) {
      console.error("Failed to complete campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async updateCampaignEmails(newEmails) {
    try {
      const campaignResult = await this.storage.loadCampaign();
      if (!campaignResult.success || !campaignResult.data) {
        return { success: false, error: "No campaign found to update" };
      }

      const campaign = campaignResult.data;
      const currentIndex = campaign.currentIndex || 0;

      // Validate that we're not removing emails that have already been sent
      if (newEmails.length < currentIndex) {
        return {
          success: false,
          error: "Cannot remove emails that have already been sent",
        };
      }

      // Convert emails array to recipients format
      const recipients = newEmails.map((email) => ({
        email,
        sent: false,
      }));

      // Update the campaign with new recipients
      const updatedCampaign = {
        ...campaign._doc,
        recipients,
        totalEmails: newEmails.length,
      };

      const saveResult = await this.storage.saveCampaign(updatedCampaign);
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
      console.error("Failed to update campaign emails:", error);
      return { success: false, error: error.message };
    }
  }

  async getCampaignStatus() {
    try {
      const campaignResult = await this.storage.loadCampaign();
      const logResult = await this.storage.getEmailLog(this.currentCampaignId);
      const todaysCountResult = await this.storage.getTodaysSentCount();

      if (!campaignResult.success) {
        return { success: false, error: "Failed to load campaign" };
      }

      const campaign = campaignResult.data;
      const emailLog = logResult.success ? logResult.data : [];
      const todaysCount = todaysCountResult.success
        ? todaysCountResult.count
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
      console.error("Failed to get campaign status:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteAllCampaigns() {
    try {
      // Stop any running campaign first
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
      console.error("Failed to delete all campaigns:", error);
      return { success: false, error: error.message };
    }
  }

  async clearAllLogs() {
    try {
      const result = await this.storage.clearAllLogs();

      console.log(`All email logs cleared: ${result.deletedCount} logs`);
      return {
        success: true,
        message: `${result.deletedCount} email logs cleared successfully`,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error("Failed to clear all logs:", error);
      return { success: false, error: error.message };
    }
  }

  async clearAll() {
    try {
      // Stop any running campaign first
      await this.stopCampaign();

      // Delete all campaigns and logs
      const campaignResult = await this.storage.deleteAllCampaigns();
      const logResult = await this.storage.clearAllLogs();

      this.currentCampaignId = null;

      console.log(
        `All data cleared: ${campaignResult.deletedCount} campaigns, ${logResult.deletedCount} logs`
      );
      return {
        success: true,
        message: `Cleared ${campaignResult.deletedCount} campaigns and ${logResult.deletedCount} email logs`,
        deletedCampaigns: campaignResult.deletedCount,
        deletedLogs: logResult.deletedCount,
      };
    } catch (error) {
      console.error("Failed to clear all data:", error);
      return { success: false, error: error.message };
    }
  }

  async updateCampaignData(campaignData) {
    try {
      const { emails, subject, content, csvData, enabledColumns, template } =
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
      });

      // Validate CSV data structure if present
      if (csvData) {
        console.log("🔍 CSV data structure validation:", {
          hasHeaders: Array.isArray(csvData.headers),
          hasData: Array.isArray(csvData.data),
          hasTotalRows: typeof csvData.totalRows === "number",
          sampleRow: csvData.data?.[0] || null,
        });

        if (!csvData.headers || !csvData.data) {
          console.warn(
            "⚠️ CSV data is incomplete - missing headers or data array"
          );
        }

        // Optimize: Only store CSV data for rows with valid emails
        // This reduces database size and prevents storing unnecessary data
        if (csvData.data && Array.isArray(csvData.data)) {
          const validEmails = new Set(emails.map((e) => e.toLowerCase()));
          csvData.data = csvData.data.filter(
            (row) => row.email && validEmails.has(row.email.toLowerCase())
          );
          csvData.totalRows = csvData.data.length;
          console.log(
            `💾 Optimized CSV data: ${csvData.data.length} rows with valid emails`
          );
        }
      }

      // Check if there's an existing campaign
      let existingCampaignResult = await this.storage.loadCampaign();

      // If a NEW csv file is uploaded (different from stored one) wipe campaigns/logs first
      if (csvData && csvData.totalRows) {
        const existingCsv = existingCampaignResult?.data?.csvData;
        const isDifferentCsv =
          !existingCsv ||
          existingCsv.totalRows !== csvData.totalRows ||
          JSON.stringify(existingCsv.headers || []) !==
            JSON.stringify(csvData.headers || []);
        if (isDifferentCsv) {
          console.log(
            "🧹 New CSV detected – clearing existing campaigns & logs before saving fresh data"
          );
          await this.storage.deleteAllCampaigns();
          await this.storage.clearAllLogs();
          existingCampaignResult = { success: false, data: null }; // force creation path
        }
      }

      let campaign;
      if (existingCampaignResult.success && existingCampaignResult.data) {
        // Update existing campaign
        const existingCampaign = existingCampaignResult.data;

        // Convert emails array to recipients format with CSV data
        const recipients = (emails || []).map((email) => {
          // Find existing recipient data to preserve sent status
          const existingRecipient = existingCampaign.recipients.find(
            (r) => r.email.toLowerCase() === email.toLowerCase()
          );

          let recipientData = {
            email,
            sent: existingRecipient?.sent || false,
            sentAt: existingRecipient?.sentAt || null,
          };

          // Add CSV data if available
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

        campaign = {
          ...existingCampaign._doc,
          subject: subject || existingCampaign.subject,
          template: template || content || existingCampaign.template,
          recipients,
          totalEmails: emails?.length || existingCampaign.totalEmails,
          csvData,
          enabledColumns: enabledColumns || [],
          updatedAt: new Date(),
        };

        this.currentCampaignId = existingCampaign._id;
      } else {
        // Create new draft campaign
        const recipients = (emails || []).map((email) => {
          let recipientData = { email, sent: false };

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
          csvData,
          enabledColumns: enabledColumns || [],
        };
      }

      const saveResult = await this.storage.saveCampaign(campaign);
      if (!saveResult.success) {
        return { success: false, error: "Failed to save campaign data" };
      }

      if (!this.currentCampaignId) {
        this.currentCampaignId = saveResult.data._id;
      }

      console.log(
        `✅ Campaign data updated successfully with ${
          campaign.recipients?.length || 0
        } recipients`
      );
      return {
        success: true,
        message: "Campaign data updated successfully",
        campaignId: saveResult.data._id.toString(),
        data: saveResult.data,
      };
    } catch (error) {
      console.error("Failed to update campaign data:", error);
      return { success: false, error: error.message };
    }
  }
}

// Create a factory function to create instances with userId
export const createCampaignScheduler = (userId = null) => {
  return new CampaignScheduler(userId);
};

// Create default instance for backward compatibility
const campaignScheduler = new CampaignScheduler();

export default campaignScheduler;
