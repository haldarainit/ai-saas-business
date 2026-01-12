import mongoose from "mongoose";

// Type definitions for nested objects
export interface IDeviceInfo {
    type: string;
    browser: string;
    os: string;
}

export interface IOpenEvent {
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    device?: IDeviceInfo;
}

export interface IClickEvent {
    timestamp: Date;
    url?: string;
    ipAddress?: string;
    userAgent?: string;
    device?: IDeviceInfo;
}

export interface ICampaignAnalyticsTotals {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    openRate: number;
    clickRate: number;
    totalOpenEvents: number;
    totalClickEvents: number;
}

export interface IEmailTracking extends mongoose.Document {
    campaignId?: string;
    emailId?: string;
    recipientEmail: string;
    userId: string;
    emailSubject?: string;
    sentAt: Date;
    status: "sent" | "opened" | "clicked" | "bounced" | "failed";
    firstOpenedAt?: Date;
    lastOpenedAt?: Date;
    totalOpens: number;
    opens: IOpenEvent[];
    totalClicks: number;
    clicks: IClickEvent[];
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    // Methods
    recordOpen(data?: Partial<IOpenEvent>): Promise<IEmailTracking>;
    recordClick(data?: Partial<IClickEvent>): Promise<IEmailTracking>;
}

export interface IEmailTrackingModel extends mongoose.Model<IEmailTracking> {
    getCampaignAnalytics(campaignId: string, userId?: string): Promise<{
        totals: ICampaignAnalyticsTotals;
        emails: IEmailTracking[];
    }>;
    getUserAnalytics(userId: string): Promise<{
        totals: ICampaignAnalyticsTotals;
        recent: IEmailTracking[];
    }>;
}

const EmailTrackingSchema = new mongoose.Schema<IEmailTracking>(
    {
        campaignId: {
            type: String,
            index: true,
        },
        emailId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        recipientEmail: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        emailSubject: {
            type: String,
        },
        sentAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
        status: {
            type: String,
            enum: ["sent", "opened", "clicked", "bounced", "failed"],
            default: "sent",
            index: true,
        },
        // Open tracking
        firstOpenedAt: {
            type: Date,
        },
        lastOpenedAt: {
            type: Date,
        },
        totalOpens: {
            type: Number,
            default: 0,
        },
        opens: [
            {
                timestamp: { type: Date, default: Date.now },
                ipAddress: String,
                userAgent: String,
                device: {
                    type: { type: String },
                    browser: String,
                    os: String,
                },
            },
        ],
        // Click tracking
        totalClicks: {
            type: Number,
            default: 0,
        },
        clicks: [
            {
                timestamp: { type: Date, default: Date.now },
                url: String,
                ipAddress: String,
                userAgent: String,
                device: {
                    type: { type: String },
                    browser: String,
                    os: String,
                },
            },
        ],
        // Additional metadata
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
EmailTrackingSchema.index({ userId: 1, sentAt: -1 });
EmailTrackingSchema.index({ campaignId: 1, sentAt: -1 });
EmailTrackingSchema.index({ recipientEmail: 1, sentAt: -1 });

// Method to record an email open
EmailTrackingSchema.methods.recordOpen = async function (data: Partial<IOpenEvent> = {}): Promise<IEmailTracking> {
    const now = new Date();

    // Update first opened time if not set
    if (!this.firstOpenedAt) {
        this.firstOpenedAt = now;
    }

    // Update last opened time
    this.lastOpenedAt = now;

    // Increment total opens
    this.totalOpens = (this.totalOpens || 0) + 1;

    // Add to opens array
    this.opens.push({
        timestamp: now,
        ipAddress: data.ipAddress || "unknown",
        userAgent: data.userAgent || "",
        device: data.device || {
            type: "unknown",
            browser: "unknown",
            os: "unknown",
        },
    });

    // Update status if it's still "sent"
    if (this.status === "sent") {
        this.status = "opened";
    }

    return await this.save();
};

// Method to record a link click
EmailTrackingSchema.methods.recordClick = async function (data: Partial<IClickEvent> = {}): Promise<IEmailTracking> {
    const now = new Date();

    // Increment total clicks
    this.totalClicks = (this.totalClicks || 0) + 1;

    // Add to clicks array
    this.clicks.push({
        timestamp: now,
        url: data.url || "",
        ipAddress: data.ipAddress || "unknown",
        userAgent: data.userAgent || "",
        device: data.device || {
            type: "unknown",
            browser: "unknown",
            os: "unknown",
        },
    });

    // Update status to clicked
    this.status = "clicked";

    return await this.save();
};

// Static method to get analytics for a campaign
EmailTrackingSchema.statics.getCampaignAnalytics = async function (
    campaignId: string,
    userId?: string
) {
    const query: { campaignId: string; userId?: string } = { campaignId };
    if (userId) {
        query.userId = userId;
    }

    const [totals, emails] = await Promise.all([
        this.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalSent: { $sum: 1 },
                    totalOpened: {
                        $sum: { $cond: [{ $gt: ["$totalOpens", 0] }, 1, 0] },
                    },
                    totalClicked: {
                        $sum: { $cond: [{ $gt: ["$totalClicks", 0] }, 1, 0] },
                    },
                    totalOpenEvents: { $sum: "$totalOpens" },
                    totalClickEvents: { $sum: "$totalClicks" },
                },
            },
        ]),
        this.find(query).sort({ sentAt: -1 }).limit(100).lean(),
    ]);

    const t = totals[0] || {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalOpenEvents: 0,
        totalClickEvents: 0,
    };

    return {
        totals: {
            totalSent: t.totalSent || 0,
            totalOpened: t.totalOpened || 0,
            totalClicked: t.totalClicked || 0,
            openRate: t.totalSent
                ? Number(((t.totalOpened / t.totalSent) * 100).toFixed(2))
                : 0,
            clickRate: t.totalSent
                ? Number(((t.totalClicked / t.totalSent) * 100).toFixed(2))
                : 0,
            totalOpenEvents: t.totalOpenEvents || 0,
            totalClickEvents: t.totalClickEvents || 0,
        },
        emails,
    };
};

// Static method to get user analytics
EmailTrackingSchema.statics.getUserAnalytics = async function (userId: string) {
    const [totals, recent] = await Promise.all([
        this.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    totalSent: { $sum: 1 },
                    totalOpened: {
                        $sum: { $cond: [{ $gt: ["$totalOpens", 0] }, 1, 0] },
                    },
                    totalClicked: {
                        $sum: { $cond: [{ $gt: ["$totalClicks", 0] }, 1, 0] },
                    },
                    totalOpenEvents: { $sum: "$totalOpens" },
                    totalClickEvents: { $sum: "$totalClicks" },
                },
            },
        ]),
        this.find({ userId }).sort({ sentAt: -1 }).limit(100).lean(),
    ]);

    const t = totals[0] || {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalOpenEvents: 0,
        totalClickEvents: 0,
    };

    return {
        totals: {
            totalSent: t.totalSent || 0,
            totalOpened: t.totalOpened || 0,
            totalClicked: t.totalClicked || 0,
            openRate: t.totalSent
                ? Number(((t.totalOpened / t.totalSent) * 100).toFixed(2))
                : 0,
            clickRate: t.totalSent
                ? Number(((t.totalClicked / t.totalSent) * 100).toFixed(2))
                : 0,
            totalOpenEvents: t.totalOpenEvents || 0,
            totalClickEvents: t.totalClickEvents || 0,
        },
        recent,
    };
};

const EmailTracking =
    mongoose.models.EmailTracking ||
    mongoose.model<IEmailTracking, IEmailTrackingModel>("EmailTracking", EmailTrackingSchema);

export default EmailTracking;
