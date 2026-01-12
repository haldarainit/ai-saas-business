import mongoose from "mongoose";

/**
 * Interface for SMTP providers configuration
 */
export interface ISmtpConfig {
    host: string;
    port: number;
    secure: boolean;
}

/**
 * Email Automation Settings Interface
 * Stores user-specific SMTP configuration for email campaigns
 */
export interface IEmailAutomationSettings extends mongoose.Document {
    userId: string;
    emailProvider: "gmail" | "hostinger" | "outlook" | "yahoo" | "zoho" | "custom";
    emailUser?: string;
    emailPassword?: string;
    fromName: string;
    smtpHost?: string;
    smtpPort: number;
    smtpSecure: boolean;
    isConfigured: boolean;
    lastVerifiedAt?: Date;
    verificationStatus: "pending" | "verified" | "failed";
    createdAt: Date;
    updatedAt: Date;
    // Virtual
    hasCredentials: boolean;
    // Methods
    getSmtpConfig(): ISmtpConfig;
}

const emailAutomationSettingsSchema = new mongoose.Schema<IEmailAutomationSettings>({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Email provider selection: gmail, hostinger, outlook, yahoo, zoho, custom
    emailProvider: {
        type: String,
        enum: ["gmail", "hostinger", "outlook", "yahoo", "zoho", "custom"],
        default: "gmail"
    },

    // Email credentials
    emailUser: { type: String }, // SMTP username / email address
    emailPassword: { type: String }, // App password (encrypted in production)

    // Display name for outgoing emails
    fromName: { type: String, default: "Email Campaign" },

    // Custom SMTP settings (only used when provider is "custom")
    smtpHost: { type: String },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },

    // Configuration status
    isConfigured: { type: Boolean, default: false },
    lastVerifiedAt: { type: Date },
    verificationStatus: {
        type: String,
        enum: ["pending", "verified", "failed"],
        default: "pending"
    },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Update timestamp on save
emailAutomationSettingsSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

// Virtual to check if credentials are set
emailAutomationSettingsSchema.virtual("hasCredentials").get(function () {
    return !!(this.emailUser && this.emailPassword);
});

// Instance method to get SMTP config
emailAutomationSettingsSchema.methods.getSmtpConfig = function (): ISmtpConfig {
    const providers: Record<string, ISmtpConfig> = {
        gmail: { host: "smtp.gmail.com", port: 587, secure: false },
        hostinger: { host: "smtp.hostinger.com", port: 587, secure: false },
        outlook: { host: "smtp-mail.outlook.com", port: 587, secure: false },
        yahoo: { host: "smtp.mail.yahoo.com", port: 587, secure: false },
        zoho: { host: "smtp.zoho.com", port: 587, secure: false },
        custom: {
            host: this.smtpHost || "",
            port: this.smtpPort || 587,
            secure: this.smtpSecure || false
        },
    };

    return providers[this.emailProvider] || providers.gmail;
};

const EmailAutomationSettings = mongoose.models.EmailAutomationSettings ||
    mongoose.model<IEmailAutomationSettings>("EmailAutomationSettings", emailAutomationSettingsSchema);

export default EmailAutomationSettings;
