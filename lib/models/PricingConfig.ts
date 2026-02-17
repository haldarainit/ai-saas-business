import mongoose from "mongoose";

type PlanKey = "free" | "starter" | "pro" | "custom";

export interface IPlanPricingConfig {
  name?: string;
  description?: string;
  monthlyCredits?: number;
  monthlyPriceUsd?: number;
  monthlyCompareAtUsd?: number | null;
  yearlyPriceUsd?: number;
  yearlyCompareAtUsd?: number | null;
  isContactSales?: boolean;
}

export interface IPricingConfig extends mongoose.Document {
  singletonKey: "global";
  currency: string;
  plans: Partial<Record<PlanKey, IPlanPricingConfig>>;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const planPricingConfigSchema = new mongoose.Schema<IPlanPricingConfig>(
  {
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    monthlyCredits: { type: Number, min: 0 },
    monthlyPriceUsd: { type: Number, min: 0 },
    monthlyCompareAtUsd: { type: Number, min: 0, default: null },
    yearlyPriceUsd: { type: Number, min: 0 },
    yearlyCompareAtUsd: { type: Number, min: 0, default: null },
    isContactSales: { type: Boolean },
  },
  { _id: false }
);

const pricingConfigSchema = new mongoose.Schema<IPricingConfig>(
  {
    singletonKey: {
      type: String,
      enum: ["global"],
      default: "global",
      unique: true,
      index: true,
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
      uppercase: true,
    },
    plans: {
      free: { type: planPricingConfigSchema, default: {} },
      starter: { type: planPricingConfigSchema, default: {} },
      pro: { type: planPricingConfigSchema, default: {} },
      custom: { type: planPricingConfigSchema, default: {} },
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const PricingConfig =
  mongoose.models.PricingConfig ||
  mongoose.model<IPricingConfig>("PricingConfig", pricingConfigSchema);

export default PricingConfig;
