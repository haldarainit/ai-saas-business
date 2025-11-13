import nodemailer from "nodemailer";

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

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      const mailOptions = {
        from: `"BusinessAI" <${process.env.EMAIL_USER || "info@myhai.in"}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || this.htmlToText(htmlContent),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        recipient: to,
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
