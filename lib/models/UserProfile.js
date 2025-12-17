import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },

    // Personal booking page settings
    username: { type: String, unique: true, sparse: true }, // For booking URL: /book/username
    displayName: { type: String },
    bio: { type: String, maxlength: 500 },
    profileImage: String,
    companyName: String,
    companyLogo: String,

    // Branding
    brandColor: { type: String, default: "#6366f1" },
    welcomeMessage: { type: String, default: "Welcome! Select an event type to schedule." },

    // Calendar connections
    googleCalendar: {
        connected: { type: Boolean, default: false },
        // User's own Google API credentials
        clientId: String,
        clientSecret: String,
        // OAuth tokens
        accessToken: String,
        refreshToken: String,
        tokenExpiry: Date,
        calendarId: { type: String, default: "primary" },
        // Connected calendar email
        connectedEmail: String,
    },
    outlookCalendar: {
        connected: { type: Boolean, default: false },
        accessToken: String,
        refreshToken: String,
        tokenExpiry: Date,
    },

    // Notification preferences
    notifications: {
        emailEnabled: { type: Boolean, default: true },
        notificationEmail: String, // Email where booking notifications are sent
        smsEnabled: { type: Boolean, default: false },
        phoneNumber: String,
        reminderTimes: {
            type: [Number], // minutes before meeting
            default: [1440, 60] // 24h and 1h before
        },
        sendFollowUp: { type: Boolean, default: false },
        followUpDelay: { type: Number, default: 24 }, // hours after meeting
    },

    // Email Settings for sending booking emails
    emailSettings: {
        // Simple provider selection: gmail, hostinger, outlook, yahoo, zoho, custom
        emailProvider: { type: String, enum: ["gmail", "hostinger", "outlook", "yahoo", "zoho", "custom"], default: "gmail" },
        emailUser: String,      // Email address / username
        emailPassword: String,  // App password
        fromName: String,       // Display name for outgoing emails
        // Custom SMTP (only used when provider is "custom")
        smtpHost: String,
        smtpPort: { type: Number, default: 587 },
        smtpSecure: { type: Boolean, default: false },
        // Email toggles
        sendConfirmationToAttendee: { type: Boolean, default: true },
        sendNotificationToHost: { type: Boolean, default: true },
        sendReminders: { type: Boolean, default: true },
        reminderHoursBefore: { type: [Number], default: [24, 1] },
    },

    // Default event settings
    defaultTimezone: { type: String, default: "Asia/Kolkata" },
    defaultDuration: { type: Number, default: 30 },
    defaultLocation: {
        type: {
            type: String,
            enum: ["video", "phone", "in-person", "custom"],
            default: "video"
        },
        provider: { type: String, default: "google-meet" },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

userProfileSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

// Generate username if not set
userProfileSchema.pre("save", async function (next) {
    if (!this.username && this.email) {
        let baseUsername = this.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        let username = baseUsername;
        let counter = 1;

        // Check for uniqueness
        const UserProfile = mongoose.model("UserProfile");
        while (await UserProfile.findOne({ username, _id: { $ne: this._id } })) {
            username = `${baseUsername}${counter}`;
            counter++;
        }
        this.username = username;
    }
    next();
});

const UserProfile = mongoose.models.UserProfile || mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
