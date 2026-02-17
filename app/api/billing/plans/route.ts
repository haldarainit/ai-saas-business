import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  BILLING_PLAN_ORDER,
  FEATURE_CREDIT_COST,
  getPlanCyclePrice,
} from "@/lib/billing/plans";
import { getUsageSnapshotForUser } from "@/lib/billing/usage";
import { getUserBillingSummary } from "@/lib/billing/subscription";
import { getSystemControlState } from "@/lib/system/control";
import { getBillingCatalog } from "@/lib/billing/catalog";

export async function GET(request: Request) {
  try {
    const catalog = await getBillingCatalog();
    const plans = BILLING_PLAN_ORDER.map((planId) => catalog.plans[planId]).map((plan) => ({
      ...plan,
      monthly: getPlanCyclePrice(plan, "monthly"),
      yearly: getPlanCyclePrice(plan, "yearly"),
    }));
    const user = await getCurrentUser(request);
    const systemControl = await getSystemControlState();
    const commonPayload = {
      plans,
      pricingCurrency: catalog.currency,
      featureCreditCost: FEATURE_CREDIT_COST,
      system: {
        paymentsEnabled: systemControl.paymentsEnabled,
        signupEnabled: systemControl.signupEnabled,
      },
    };

    if (!user) {
      return NextResponse.json({
        ...commonPayload,
        viewer: {
          isAuthenticated: false,
        },
      });
    }

    const [usage, billing] = await Promise.all([
      getUsageSnapshotForUser(user),
      getUserBillingSummary(user),
    ]);

    return NextResponse.json({
      ...commonPayload,
      viewer: {
        isAuthenticated: true,
        billing,
        usage,
      },
    });
  } catch (error) {
    console.error("Error fetching billing plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing plans" },
      { status: 500 }
    );
  }
}
