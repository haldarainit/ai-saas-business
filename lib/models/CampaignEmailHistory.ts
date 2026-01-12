import mongoose from "mongoose";

export interface IDeliveryDetails {
    messageId?: string;
    provider?: string;
    attempt?: number;
}

export interface ICampaignEmailHistory extends mongoose.Document {
    userId: string;
    campaignId: mongoose.Types.ObjectId;
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    status: "pending" | "sent" | "failed" | "bounced" | "opened" | "clicked";
    sentAt: Date;
    error?: string;
    deliveryDetails?: IDeliveryDetails;
    createdAt: Date;
    updatedAt: Date;
}

const CampaignEmailHistorySchema = new mongoose.Schema<ICampaignEmailHistory>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
            index: true,
        },
        recipientEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        recipientName: {
            type: String,
            trim: true,
        },
        subject: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "sent", "failed", "bounced", "opened", "clicked"],
            required: true,
            default: "pending",
            index: true,
        },
        sentAt: {
            type: Date,
            required: true,
            index: true,
        },
        error: {
            type: String,
        },
        deliveryDetails: {
            messageId: String,
            provider: String,
            attempt: { type: Number, default: 1 },
        },
    },
    {
        timestamps: true,
    }
);

// IMPORTANT: Unique compound index to prevent duplicate logs for same campaign+recipient
CampaignEmailHistorySchema.index(
    { campaignId: 1, recipientEmail: 1 },
    { unique: true }
);

// Other indexes for common queries
CampaignEmailHistorySchema.index({ userId: 1, sentAt: -1 });
CampaignEmailHistorySchema.index({ campaignId: 1, status: 1 });
CampaignEmailHistorySchema.index({ recipientEmail: 1, sentAt: -1 });
CampaignEmailHistorySchema.index({ sentAt: -1 });

const CampaignEmailHistory =
    mongoose.models.CampaignEmailHistory ||
    mongoose.model<ICampaignEmailHistory>("CampaignEmailHistory", CampaignEmailHistorySchema);

export default CampaignEmailHistory;
