import nodemailer from "nodemailer";
import {
  embedTrackingPixel,
  wrapLinksWithTracking,
  generateTrackingId,
} from "../tracking-utils.js";
import connectDB from "../mongodb.ts";
import EmailTracking from "../models/EmailTracking.js";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465, // use 465 for SSL
      secure: true, // true for SSL
      auth: {
        user: process.env.EMAIL_USER || "info@myhai.in",
        pass: process.env.EMAIL_PASSWORD || "YOUR_EMAIL_PASSWORD", // replace with your Hostinger email password
      },
    });
  }

  async sendEmail(to, subject, htmlContent, textContent = null, options = {}) {
    try {
      let finalHtmlContent = htmlContent;
      let trackingId = null;

      // Add tracking if enabled and campaign info is provided
      if (
        options.enableTracking !== false &&
        options.campaignId &&
        options.userId
      ) {
        // Generate unique tracking ID
        trackingId = generateTrackingId(options.campaignId, to);

        // Wrap links with tracking URLs
        finalHtmlContent = wrapLinksWithTracking(
          htmlContent,
          trackingId,
          options.baseUrl
        );

        // Embed tracking pixel
        finalHtmlContent = embedTrackingPixel(
          finalHtmlContent,
          trackingId,
          options.baseUrl
        );

        // Create tracking record in database
        try {
          console.log("Creating tracking record...");
          console.log("Campaign ID:", options.campaignId);
          console.log("Tracking ID:", trackingId);
          console.log("Recipient:", to);
          console.log("User ID:", options.userId);

          // Connect to database first
          await connectDB();
          console.log("Database connected for tracking");

          const trackingRecord = await EmailTracking.create({
            campaignId: options.campaignId,
            emailId: trackingId,
            recipientEmail: to,
            userId: options.userId,
            emailSubject: subject,
            status: "sent",
            sentAt: new Date(),
          });
          console.log(
            `✅ Tracking record created successfully for ${to} with tracking ID: ${trackingId}`
          );
          console.log("Record ID:", trackingRecord._id);
        } catch (trackingError) {
          console.error("❌ Failed to create tracking record:", trackingError);
          console.error("Error details:", trackingError.message);
          // Continue sending email even if tracking fails
        }
      }

      const mailOptions = {
        from: `"BusinessAI" <${process.env.EMAIL_USER || "info@myhai.in"}>`,
        to: to,
        subject: subject,
        html: finalHtmlContent,
        text: textContent || this.htmlToText(htmlContent),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        recipient: to,
        trackingId: trackingId,
      };
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      return {
        success: false,
        error: error.message,
        recipient: to,
      };
    }
  }

  // Convert HTML to plain text for fallback
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service connection verified successfully");
      return { success: true };
    } catch (error) {
      console.error("Email service connection failed:", error);
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;
