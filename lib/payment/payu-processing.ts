import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import PaymentTransaction, {
  type PaymentStatus,
} from "@/lib/models/PaymentTransaction";
import {
  getPayUConfig,
  normalizePayUStatus,
  verifyPayUResponseHash,
  type PayUResponsePayload,
} from "@/lib/payment/payu";
import {
  getNextMonthlyRenewalDate,
  getNextYearlyRenewalDate,
} from "@/lib/billing/subscription";

export interface ProcessPayUResult {
  success: boolean;
  statusCode: number;
  message: string;
  transactionId?: string;
  paymentStatus?: PaymentStatus;
  planApplied?: boolean;
}

export async function processPayUPayload(params: {
  payload: PayUResponsePayload;
  source: "validate" | "webhook";
}): Promise<ProcessPayUResult> {
  const { payload, source } = params;
  const { merchantSalt } = getPayUConfig();

  if (!merchantSalt) {
    return {
      success: false,
      statusCode: 500,
      message: "PayU is not configured on server",
    };
  }

  if (!payload.txnid || !payload.hash) {
    return {
      success: false,
      statusCode: 400,
      message: "Missing required payment parameters",
    };
  }

  const isHashValid = verifyPayUResponseHash(payload, merchantSalt);

  if (!isHashValid) {
    return {
      success: false,
      statusCode: 400,
      message: "Invalid payment response hash",
    };
  }

  await dbConnect();

  const transaction =
    (await PaymentTransaction.findOne({ txnId: payload.txnid })) ||
    (payload.udf1 ? await PaymentTransaction.findById(payload.udf1) : null);

  if (!transaction) {
    return {
      success: false,
      statusCode: 404,
      message: "Payment transaction not found",
    };
  }

  const normalizedStatus = normalizePayUStatus(payload.status);
  const shouldApplyPlan =
    normalizedStatus === "success" && transaction.status !== "success";

  transaction.status = normalizedStatus;
  transaction.source = source;
  transaction.metadata = {
    ...transaction.metadata,
    mihpayid: payload.mihpayid,
    mode: payload.mode,
    bankcode: payload.bankcode,
    bankRefNo: payload.bank_ref_no,
    error: payload.error,
    errorMessage: payload.error_Message,
    hash: payload.hash,
    rawPayload: payload,
  };

  if (normalizedStatus === "success" && !transaction.activatedAt) {
    transaction.activatedAt = new Date();
  }

  await transaction.save();

  if (shouldApplyPlan) {
    const now = new Date();
    const billingCycle =
      transaction.metadata?.billingCycle === "yearly" ? "yearly" : "monthly";

    await User.findByIdAndUpdate(transaction.userId, {
      $set: {
        planId: transaction.planId,
        planStatus: "active",
        planBillingCycle: billingCycle,
        planStartedAt: now,
        planRenewalAt:
          billingCycle === "yearly"
            ? getNextYearlyRenewalDate(now)
            : getNextMonthlyRenewalDate(now),
        lastPaymentAt: now,
      },
    });
  }

  return {
    success: true,
    statusCode: 200,
    message: "Payment processed successfully",
    transactionId: String(transaction._id),
    paymentStatus: normalizedStatus,
    planApplied: shouldApplyPlan,
  };
}
