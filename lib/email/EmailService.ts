import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import dbConnect from "../mongodb";
import EmailTracking from "../models/EmailTracking";
import EmailAutomationSettings, { type IEmailAutomationSettings } from "../models/EmailAutomationSettings";

/**
 * Email provider SMTP presets
 */
interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
}

const EMAIL_PROVIDERS: Record<string, SmtpConfig> = {
    gmail: { host: "smtp.gmail.com", port: 587, secure: false },
    hostinger: { host: "smtp.hostinger.com", port: 587, secure: false },
    outlook: { host: "smtp-mail.outlook.com", port: 587, secure: false },
    yahoo: { host: "smtp.mail.yahoo.com", port: 587, secure: false },
    zoho: { host: "smtp.zoho.com", port: 587, secure: false },
    custom: { host: "", port: 587, secure: false },
};

interface EmailSettings {
    emailProvider?: string;
    emailUser?: string;
    emailPassword?: string;
    fromName?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
}

interface SendEmailOptions {
    enableTracking?: boolean;
    baseUrl?: string;
    ctaUrl?: string;
    ctaText?: string;
    campaignEmailHistoryId?: string;
    campaignId?: string;
    emailId?: string;
    userId?: string;
}

interface SendEmailResult {
    success: boolean;
    messageId?: string;
    recipient: string;
    trackingId?: string;
    error?: string;
}

interface TestConnectionResult {
    success: boolean;
    error?: string;
}

function ensureTrailingSlash(url: string | undefined): string {
    if (!url) return "";
    return url.endsWith("/") ? url.slice(0, -1) : url;
}

function rewriteLinksForClickTracking(html: string, trackingId: string, baseUrl: string | undefined): string {
    if (!html) return html;
    const safeBase =
        ensureTrailingSlash(baseUrl) ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000";
    // Replace ALL href="http(s)://..." with tracked redirect links
    // This includes regular links, CTA buttons inserted via the editor,
    // and any other clickable elements in the email
    return html.replace(/href=\"(http[s]?:[^\"\s]+)\"/gi, (_match, url: string) => {
        const encoded = encodeURIComponent(url);
        const tracked = `${safeBase}/api/track/click/${trackingId}?url=${encoded}`;
        return `href="${tracked}"`;
    });
}

function appendCTAButton(html: string, ctaUrl: string, ctaText: string): string {
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

function appendOpenPixel(html: string, trackingId: string, baseUrl: string | undefined): string {
    const safeBase =
        ensureTrailingSlash(baseUrl) ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000";
    const pixelUrl = `${safeBase}/api/track/pixel/${trackingId}`;
    // 1x1 invisible tracking pixel
    const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:block;width:1px;height:1px;" alt="" />`;
    if (!html) return pixel;
    if (html.includes("</body>")) {
        return html.replace(/<\/body>/i, `${pixel}</body>`);
    }
    return html + pixel;
}

class EmailService {
    private emailSettings: EmailSettings | null;
    private fromName: string;
    private fromEmail: string;
    private transporter: Transporter;

    constructor(emailSettings: EmailSettings | IEmailAutomationSettings | null = null) {
        this.emailSettings = emailSettings;
        this.fromName = emailSettings?.fromName || "Email Campaign";
        this.fromEmail = emailSettings?.emailUser || process.env.EMAIL_USER || "";

        // Create transporter based on provided settings or fall back to env
        if (emailSettings && emailSettings.emailUser && emailSettings.emailPassword) {
            // Use user-specific settings
            const provider = emailSettings.emailProvider || "gmail";
            const providerConfig = EMAIL_PROVIDERS[provider] || EMAIL_PROVIDERS.gmail;

            const host = provider === "custom" ? emailSettings.smtpHost || "" : providerConfig.host;
            const port = provider === "custom" ? (emailSettings.smtpPort || 587) : providerConfig.port;
            const secure = provider === "custom" ? (emailSettings.smtpSecure || false) : providerConfig.secure;

            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: {
                    user: emailSettings.emailUser,
                    pass: emailSettings.emailPassword,
                },
            });
            console.log(`📧 EmailService initialized with user settings (${emailSettings.emailProvider || 'gmail'})`);
        } else {
            // Fall back to environment variables
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "smtp.gmail.com",
                port: parseInt(process.env.EMAIL_PORT || "587"),
                secure: process.env.EMAIL_SECURE === "true",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });
            console.log("📧 EmailService initialized with environment credentials");
        }
    }

    /**
     * Configure the email service with user-specific settings from the database
     * @param userId - The user ID to load settings for
     * @returns Whether configuration was successful
     */
    static async createForUser(userId: string): Promise<EmailService> {
        try {
            await dbConnect();
            const settings = await EmailAutomationSettings.findOne({ userId });

            if (settings && settings.emailUser && settings.emailPassword) {
                return new EmailService(settings);
            }

            // Fall back to default (env-based) configuration
            console.log(`📧 No user email settings found for ${userId}, using default`);
            return new EmailService();
        } catch (error) {
            console.error("Error loading user email settings:", error);
            return new EmailService();
        }
    }

    /**
     * Check if the service has user-specific configuration
     */
    hasUserConfig(): boolean {
        return !!(this.emailSettings && this.emailSettings.emailUser);
    }

    async sendEmail(
        to: string,
        subject: string,
        htmlContent: string,
        textContent: string | null = null,
        options: SendEmailOptions = {}
    ): Promise<SendEmailResult> {
        try {
            let finalHtml = htmlContent;
            let trackingId: string | undefined;

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
                const savedTracking = await tracking.save();
                const currentTrackingId = savedTracking._id.toString();
                trackingId = currentTrackingId;

                // Rewrite links and append pixel
                finalHtml = rewriteLinksForClickTracking(
                    finalHtml,
                    currentTrackingId,
                    baseUrl
                );
                finalHtml = appendOpenPixel(
                    finalHtml,
                    currentTrackingId,
                    baseUrl
                );
            }

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
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
                trackingId,
            };
        } catch (error) {
            console.error(`Failed to send email to ${to}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                recipient: to,
            };
        }
    }

    // Convert HTML to plain text for fallback
    htmlToText(html: string): string {
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
    async testConnection(): Promise<TestConnectionResult> {
        try {
            await this.transporter.verify();
            console.log("Email service connection verified successfully");
            return { success: true };
        } catch (error) {
            console.error("Email service connection failed:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
}

export default EmailService;
export type { EmailSettings, SendEmailOptions, SendEmailResult, TestConnectionResult };
