import nodemailer from "nodemailer";
import dbConnect from "../mongodb";
import EmailTracking from "../models/EmailTracking";

function ensureTrailingSlash(url) {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function rewriteLinksForClickTracking(html, trackingId, baseUrl) {
  if (!html) return html;
  const safeBase =
    ensureTrailingSlash(baseUrl) ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";
  // Replace href="http(s)://..." with tracked redirect links
  return html.replace(/href=\"(http[s]?:[^\"\s]+)\"/gi, (match, url) => {
    const encoded = encodeURIComponent(url);
    const tracked = `${safeBase}/api/track/click/${trackingId}?url=${encoded}`;
    return `href="${tracked}"`;
  });
}

function appendCTAButton(html, ctaUrl, ctaText) {
  if (!ctaUrl || !ctaText) return html;

  const ctaButton = `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${ctaUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
        ${ctaText}
      </a>
    </div>
  `;

  if (!html) return ctaButton;
  if (html.includes("</body>")) {
    return html.replace(/<\/body>/i, `${ctaButton}</body>`);
  }
  return html + ctaButton;
}

function appendOpenPixel(html, trackingId, baseUrl) {
  const safeBase =
    ensureTrailingSlash(baseUrl) ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";
  const pixelUrl = `${safeBase}/api/track/pixel/${trackingId}`;
  // Changed to visible image for testing - you can see if images are loading
  const pixel = `<div style="text-align: center; margin: 20px 0; padding: 10px; background: #f0f0f0; border: 2px dashed #ccc;">
    <p style="margin: 10px 0; color: #666; font-size: 12px;">📊 Email Tracking Active</p>
    <img src="${pixelUrl}" width="100" height="100" style="display: block; margin: 0 auto; border: 2px solid #4CAF50;" alt="Tracking Image" />
    <p style="margin: 10px 0; color: #999; font-size: 10px;">If you see this image, tracking is working correctly</p>
  </div>`;
  if (!html) return pixel;
  if (html.includes("</body>")) {
    return html.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return html + pixel;
}

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
      let finalHtml = htmlContent;
      let trackingDoc = null;

      if (options.enableTracking) {
        await dbConnect();
        const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_BASE_URL;

        // Add CTA button if provided (before creating tracking record)
        if (options.ctaUrl && options.ctaText) {
          finalHtml = appendCTAButton(
            finalHtml,
            options.ctaUrl,
            options.ctaText
          );
        }

        // Create tracking record
        const tracking = new EmailTracking({
          campaignId: options.campaignEmailHistoryId || options.campaignId,
          emailId: options.emailId || Math.random().toString(36).slice(2),
          recipientEmail: to,
          userId: options.userId || "system",
          emailSubject: subject,
          sentAt: new Date(),
          status: "sent",
        });
        trackingDoc = await tracking.save();

        // Rewrite links and append pixel
        finalHtml = rewriteLinksForClickTracking(
          finalHtml,
          trackingDoc._id.toString(),
          baseUrl
        );
        finalHtml = appendOpenPixel(
          finalHtml,
          trackingDoc._id.toString(),
          baseUrl
        );
      }

      const mailOptions = {
        from: `"BusinessAI" <${process.env.EMAIL_USER || "info@myhai.in"}>`,
        to: to,
        subject: subject,
        html: finalHtml,
        text: textContent || this.htmlToText(finalHtml),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        recipient: to,
        trackingId: trackingDoc ? trackingDoc._id.toString() : undefined,
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
