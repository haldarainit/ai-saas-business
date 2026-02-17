import mongoose from "mongoose";
import type { BillingCycle, PlanId } from "@/lib/billing/plans";

export type PaymentStatus =
  | "initiated"
  | "pending"
  | "success"
  | "failed"
  | "cancelled";

export interface IPaymentTransaction extends mongoose.Document {
  userId: string;
  email: string;
  planId: PlanId;
  amount: number;
  currency: string;
  gateway: "payu";
  txnId?: string;
  status: PaymentStatus;
  source?: "create" | "validate" | "webhook";
  activatedAt?: Date;
  metadata: {
    productInfo?: string;
    mihpayid?: string;
    mode?: string;
    bankcode?: string;
    bankRefNo?: string;
    error?: string;
    errorMessage?: string;
    hash?: string;
    billingCycle?: BillingCycle;
    rawPayload?: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new mongoose.Schema<IPaymentTransaction>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    planId: {
      type: String,
      enum: ["free", "starter", "pro", "custom"],
      required: true,
      default: "free",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
    },
    gateway: {
      type: String,
      enum: ["payu"],
      default: "payu",
    },
    txnId: {
      type: String,
      sparse: true,
      index: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["initiated", "pending", "success", "failed", "cancelled"],
      default: "initiated",
      index: true,
    },
    source: {
      type: String,
      enum: ["create", "validate", "webhook"],
      default: "create",
    },
    activatedAt: {
      type: Date,
    },
    metadata: {
      productInfo: String,
      mihpayid: String,
      mode: String,
      bankcode: String,
      bankRefNo: String,
      error: String,
      errorMessage: String,
      hash: String,
      billingCycle: {
        type: String,
        enum: ["monthly", "yearly"],
      },
      rawPayload: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
  },
  {
    timestamps: true,
  }
);

paymentTransactionSchema.index({ userId: 1, createdAt: -1 });

const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  mongoose.model<IPaymentTransaction>(
    "PaymentTransaction",
    paymentTransactionSchema
  );

export default PaymentTransaction;
