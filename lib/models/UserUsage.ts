import mongoose from "mongoose";

export interface IUserUsage extends mongoose.Document {
  userId: string;
  periodKey: string; // YYYY-MM
  totalCreditsUsed: number;
  totalRequests: number;
  featureRequests: Map<string, number>;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userUsageSchema = new mongoose.Schema<IUserUsage>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    periodKey: {
      type: String,
      required: true,
      index: true,
    },
    totalCreditsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRequests: {
      type: Number,
      default: 0,
      min: 0,
    },
    featureRequests: {
      type: Map,
      of: Number,
      default: {},
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userUsageSchema.index({ userId: 1, periodKey: 1 }, { unique: true });

const UserUsage =
  mongoose.models.UserUsage ||
  mongoose.model<IUserUsage>("UserUsage", userUsageSchema);

export default UserUsage;
