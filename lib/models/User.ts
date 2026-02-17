import mongoose from "mongoose";
import type { BillingCycle, PlanId } from "@/lib/billing/plans";

export interface IUser extends mongoose.Document {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  googleId?: string;
  authProvider?: "local" | "google";
  image?: string;
  onboardingCompleted?: boolean;
  role: "user" | "admin";
  planId: PlanId;
  planBillingCycle: BillingCycle;
  planStatus: "active" | "past_due" | "cancelled" | "trial";
  planStartedAt?: Date;
  planRenewalAt?: Date;
  lastPaymentAt?: Date;
  rateLimitBonusCredits: number;
  customMonthlyCredits?: number | null;
  isUnlimitedAccess: boolean;
  developerModeEnabled: boolean;
  accountStatus: "active" | "suspended";
  suspendedReason?: string;
  sessionVersion: number;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Not required for Google OAuth users
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    image: {
      type: String,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    planId: {
      type: String,
      enum: ["free", "starter", "pro", "custom"],
      default: "free",
      index: true,
    },
    planBillingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    planStatus: {
      type: String,
      enum: ["active", "past_due", "cancelled", "trial"],
      default: "active",
    },
    planStartedAt: {
      type: Date,
      default: Date.now,
    },
    planRenewalAt: {
      type: Date,
    },
    lastPaymentAt: {
      type: Date,
    },
    rateLimitBonusCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    customMonthlyCredits: {
      type: Number,
      default: null,
      min: 0,
    },
    isUnlimitedAccess: {
      type: Boolean,
      default: false,
      index: true,
    },
    developerModeEnabled: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    suspendedReason: {
      type: String,
      trim: true,
    },
    sessionVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Remove duplicate index - unique: true already creates an index
// UserSchema.index({ email: 1 })

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
