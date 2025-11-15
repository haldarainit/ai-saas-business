import mongoose from "mongoose";

const EmailLogSchema = new mongoose.Schema(
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

// Add compound indexes for better query performance
EmailLogSchema.index({ userId: 1, sentAt: -1 });
EmailLogSchema.index({ campaignId: 1, status: 1 });
EmailLogSchema.index({ recipientEmail: 1, sentAt: -1 });
EmailLogSchema.index({ sentAt: -1 }); // For daily counts

const EmailLog =
  mongoose.models.EmailLog || mongoose.model("EmailLog", EmailLogSchema);

export default EmailLog;
