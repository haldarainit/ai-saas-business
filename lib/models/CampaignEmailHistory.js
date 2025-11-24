import mongoose from "mongoose";

const CampaignEmailHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
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
      enum: ["sent", "failed", "bounced", "opened", "clicked"],
      required: true,
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

// Indexes for common queries
CampaignEmailHistorySchema.index({ userId: 1, sentAt: -1 });
CampaignEmailHistorySchema.index({ campaignId: 1, status: 1 });
CampaignEmailHistorySchema.index({ recipientEmail: 1, sentAt: -1 });
CampaignEmailHistorySchema.index({ sentAt: -1 });

const CampaignEmailHistory =
  mongoose.models.CampaignEmailHistory ||
  mongoose.model("CampaignEmailHistory", CampaignEmailHistorySchema);

export default CampaignEmailHistory;
