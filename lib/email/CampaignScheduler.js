import cron from "node-cron";
import EmailService from "./EmailService.js";
import CampaignStorage from "./CampaignStorage.js";

class CampaignScheduler {
  constructor() {
    this.emailService = new EmailService();
    this.storage = new CampaignStorage();
    this.cronJob = null;
    this.isRunning = false;
    this.maxEmailsPerDay = 20;
    this.emailInterval = 1; // minutes

    // Initialize on startup
    this.init();
  }

  async init() {
    // Check if there's an active campaign on startup
    const campaignResult = await this.storage.loadCampaign();
    if (
      campaignResult.success &&
      campaignResult.data &&
      campaignResult.data.isActive
    ) {
      console.log("Resuming active campaign from storage...");
      await this.resumeCampaign();
    }
  }

  async startCampaign(campaignData) {
    try {
      const { emails, subject, content, csvData, enabledColumns } =
        campaignData;

      if (!emails || emails.length === 0) {
        return { success: false, error: "No recipients provided" };
      }

      // Check if there's already an existing paused campaign
      const existingCampaignResult = await this.storage.loadCampaign();
      if (
        existingCampaignResult.success &&
        existingCampaignResult.data &&
        !existingCampaignResult.data.isActive
      ) {
        // There's a paused campaign, resume it instead of creating new one
        const existingCampaign = existingCampaignResult.data;

        // Update the campaign with current data but preserve the currentIndex
        const updatedCampaign = {
          ...existingCampaign,
          emails,
          subject,
          content,
          csvData,
          isActive: true,
          totalEmails: emails.length,
          resumedAt: new Date().toISOString(),
        };

        const saveResult = await this.storage.saveCampaign(updatedCampaign);
        if (!saveResult.success) {
          return { success: false, error: "Failed to save campaign" };
        }

        // Start the cron job
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
          campaignId: existingCampaign.id,
          resumed: true,
        };
      }

      // No existing campaign or existing is still active, create new campaign
      const campaign = {
        id: Date.now().toString(),
        emails,
        subject,
        content,
        csvData,
        enabledColumns: enabledColumns || [],
        currentIndex: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        totalEmails: emails.length,
      };

      const saveResult = await this.storage.saveCampaign(campaign);
      if (!saveResult.success) {
        return { success: false, error: "Failed to save campaign" };
      }

      // Start the cron job
      await this.startCronJob();

      console.log(`New campaign started with ${emails.length} recipients`);
      return {
        success: true,
        message: "Campaign started successfully",
        campaignId: campaign.id,
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
      if (campaign.isActive && this.isRunning) {
        return { success: true, message: "Campaign is already running" };
      }

      // Reactivate the campaign
      const updatedCampaign = {
        ...campaign,
        isActive: true,
        resumedAt: new Date().toISOString(),
      };

      const saveResult = await this.storage.saveCampaign(updatedCampaign);
      if (!saveResult.success) {
        return { success: false, error: "Failed to save resumed campaign" };
      }

      // Start the cron job
      await this.startCronJob();

      const currentIndex = campaign.currentIndex || 0;
      const remainingEmails = campaign.emails.length - currentIndex;

      console.log(
        `Campaign resumed from email ${currentIndex + 1}/${
          campaign.emails.length
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
      const campaignResult = await this.storage.loadCampaign();
      if (campaignResult.success && campaignResult.data) {
        const updatedCampaign = {
          ...campaignResult.data,
          isActive: false,
          stoppedAt: new Date().toISOString(),
        };
        await this.storage.saveCampaign(updatedCampaign);
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
      await this.storage.deleteCampaign();
      await this.storage.clearLog();

      console.log("Campaign reset");
      return { success: true, message: "Campaign reset successfully" };
    } catch (error) {
      console.error("Failed to reset campaign:", error);
      return { success: false, error: error.message };
    }
  }

  async startCronJob() {
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
        !campaignResult.data.isActive
      ) {
        console.log("No active campaign found");
        await this.stopCampaign();
        return;
      }

      const campaign = campaignResult.data;
      const { emails, subject, content, currentIndex } = campaign;

      // Check if campaign is complete
      if (currentIndex >= emails.length) {
        console.log("Campaign completed - all emails sent");
        await this.completeCampaign();
        return;
      }

      const recipientEmail = emails[currentIndex];

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
      let personalizedContent = content;

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
          emails.length
        } to: ${recipientEmail}`
      );
      const result = await this.emailService.sendEmail(
        recipientEmail,
        personalizedSubject,
        personalizedContent
      );

      // Log the email attempt
      await this.storage.logEmailSent({
        recipient: recipientEmail,
        subject: personalizedSubject,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        campaignId: campaign.id,
        emailIndex: currentIndex,
      });

      // Update campaign progress
      const updatedCampaign = {
        ...campaign,
        currentIndex: currentIndex + 1,
        lastEmailSentAt: new Date().toISOString(),
      };

      await this.storage.saveCampaign(updatedCampaign);

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
      const campaignResult = await this.storage.loadCampaign();
      if (campaignResult.success && campaignResult.data) {
        const completedCampaign = {
          ...campaignResult.data,
          isActive: false,
          completedAt: new Date().toISOString(),
        };
        await this.storage.saveCampaign(completedCampaign);
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

      // Update the campaign with new emails
      const updatedCampaign = {
        ...campaign,
        emails: newEmails,
        totalEmails: newEmails.length,
        updatedAt: new Date().toISOString(),
      };

      const saveResult = await this.storage.saveCampaign(updatedCampaign);
      if (!saveResult.success) {
        return { success: false, error: "Failed to save updated campaign" };
      }

      console.log(`Campaign emails updated: ${newEmails.length} recipients`);
      return {
        success: true,
        message: "Campaign emails updated successfully",
        updatedCampaign,
      };
    } catch (error) {
      console.error("Failed to update campaign emails:", error);
      return { success: false, error: error.message };
    }
  }

  async getCampaignStatus() {
    try {
      const campaignResult = await this.storage.loadCampaign();
      const logResult = await this.storage.getEmailLog();
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
}

// Create singleton instance
const campaignScheduler = new CampaignScheduler();

export default campaignScheduler;
