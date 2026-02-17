import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUsageSnapshotForUser } from "@/lib/billing/usage";
import { getUserBillingSummary } from "@/lib/billing/subscription";
import { FEATURE_CREDIT_COST } from "@/lib/billing/plans";
import { getBillingCatalog } from "@/lib/billing/catalog";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const catalog = await getBillingCatalog();
    const usage = await getUsageSnapshotForUser(user);
    const billing = await getUserBillingSummary(user);

    return NextResponse.json({
      pricingCurrency: catalog.currency,
      billing,
      usage,
      featureCreditCost: FEATURE_CREDIT_COST,
    });
  } catch (error) {
    console.error("Error fetching billing usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
