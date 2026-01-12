import mongoose from "mongoose";

export interface ICsvData {
  headers?: string[];
  data?: unknown[];
  totalRows?: number;
}

export interface IRecipient {
  email: string;
  name?: string;
  sent?: boolean;
  sentAt?: Date;
  error?: string;
}

export interface ICampaignSettings {
  batchSize?: number;
  delay?: number;
  maxRetries?: number;
}

export interface ICampaign extends mongoose.Document {
  userId?: string;
  subject: string;
  template: string;
  recipients: IRecipient[];
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  totalEmails: number;
  sentCount: number;
  failedCount: number;
  sendingSpeed: number; // emails per minute
  currentIndex: number;
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  settings: ICampaignSettings;
  csvData?: ICsvData;
  enabledColumns?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RecipientSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    name: { type: String },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    error: { type: String },
  },
  { _id: false }
);

const CampaignSchema = new mongoose.Schema<ICampaign>(
  {
    userId: {
      type: String,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    template: {
      type: String,
      required: true,
    },
    recipients: [RecipientSchema],
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
    totalEmails: {
      type: Number,
      required: true,
      default: 0,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    sendingSpeed: {
      type: Number,
      default: 10, // emails per minute
    },
    currentIndex: {
      type: Number,
      default: 0,
    },
    scheduledStartTime: Date,
    actualStartTime: Date,
    completedAt: Date,
    pausedAt: Date,
    settings: {
      batchSize: { type: Number, default: 10 },
      delay: { type: Number, default: 6000 }, // milliseconds
      maxRetries: { type: Number, default: 3 },
    },
    // Store CSV data for template processing
    csvData: {
      headers: [String],
      data: [mongoose.Schema.Types.Mixed],
      totalRows: Number,
    },
    enabledColumns: [String],
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
CampaignSchema.index({ userId: 1, status: 1 });
CampaignSchema.index({ createdAt: -1 });
CampaignSchema.index({ status: 1, scheduledStartTime: 1 });

const Campaign =
  mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", CampaignSchema);

export default Campaign;
