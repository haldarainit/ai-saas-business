import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getPayUConfig,
  generatePayUTxnId,
  generatePayURequestHash,
} from "@/lib/payment/payu";
import {
  getPlanCyclePrice,
  type BillingCycle,
  type PlanId,
} from "@/lib/billing/plans";
import PaymentTransaction from "@/lib/models/PaymentTransaction";
import dbConnect from "@/lib/mongodb";
import { enforceSystemAccess } from "@/lib/system/enforce";
import { enforceRateLimit, getClientIpAddress } from "@/lib/security/rate-limit";
import { getBillingCatalog, getPlanDefinitionResolved } from "@/lib/billing/catalog";

interface CreatePaymentBody {
  planId: PlanId;
  billingCycle?: BillingCycle;
}

function getOriginFromRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host");

  if (forwardedProto && host) {
    return `${forwardedProto}://${host}`;
  }

  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimit = enforceRateLimit({
      key: `payu-create:${ipAddress}`,
      windowMs: 5 * 60 * 1000,
      maxRequests: 30,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many payment requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const systemAccess = await enforceSystemAccess({
      user,
      capability: "payments",
    });

    if (!systemAccess.ok) {
      return systemAccess.response;
    }

    const { merchantKey, merchantSalt, baseUrl } = getPayUConfig();
    if (!merchantKey || !merchantSalt) {
      return NextResponse.json(
        {
          error:
            "PayU is not configured. Set PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT.",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CreatePaymentBody;
    if (!body?.planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const billingCycle: BillingCycle =
      body.billingCycle === "yearly" ? "yearly" : "monthly";
    const catalog = await getBillingCatalog();
    const selectedPlan = await getPlanDefinitionResolved(body.planId);

    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    if (selectedPlan.id !== "starter" && selectedPlan.id !== "pro") {
      return NextResponse.json(
        { error: "Only paid plans can be purchased from checkout." },
        { status: 400 }
      );
    }

    if (selectedPlan.isContactSales) {
      return NextResponse.json(
        { error: "Selected plan is configured as contact-sales only." },
        { status: 400 }
      );
    }

    const cyclePrice = getPlanCyclePrice(selectedPlan, billingCycle);
    if (cyclePrice.priceUsd <= 0) {
      return NextResponse.json(
        { error: "Selected billing amount is invalid." },
        { status: 400 }
      );
    }

    await dbConnect();

    const transaction = await PaymentTransaction.create({
      userId: String(user._id),
      email: user.email,
      planId: selectedPlan.id,
      amount: cyclePrice.priceUsd,
      currency: catalog.currency,
      gateway: "payu",
      status: "initiated",
      source: "create",
      metadata: {
        productInfo: `${selectedPlan.name} Plan (${billingCycle})`,
        billingCycle,
      },
    });

    const txnId = generatePayUTxnId();
    transaction.txnId = txnId;
    await transaction.save();

    const origin = getOriginFromRequest(request);
    const successUrl = `${origin}/api/payment/payu/return?type=success`;
    const failureUrl = `${origin}/api/payment/payu/return?type=failure`;
    const cancelUrl = `${origin}/api/payment/payu/return?type=cancel`;

    const payUParams = {
      key: merchantKey,
      txnid: txnId,
      amount: cyclePrice.priceUsd.toFixed(2),
      productinfo: `Business AI ${selectedPlan.name} Plan (${billingCycle})`,
      firstname: user.name || "Customer",
      email: user.email,
      phone: user.phone || "9999999999",
      surl: successUrl,
      furl: failureUrl,
      curl: cancelUrl,
      udf1: String(transaction._id),
      udf2: String(user._id),
      udf3: selectedPlan.id,
      udf4: billingCycle,
      udf5: "",
    };

    const hash = generatePayURequestHash(payUParams, merchantSalt);

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: `${baseUrl}/_payment`,
        payUParams: {
          ...payUParams,
          hash,
        },
        billingCycle,
        amount: cyclePrice.priceUsd,
        currency: catalog.currency,
        transactionId: String(transaction._id),
        txnId,
      },
    });
  } catch (error) {
    console.error("Error creating PayU payment session:", error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}
