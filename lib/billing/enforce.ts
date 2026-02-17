import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { consumeCreditsForUser, type UsageConsumeResult } from "@/lib/billing/usage";
import { type BillingFeature } from "@/lib/billing/plans";
import type { IUser } from "@/lib/models/User";
import { enforceSystemAccess } from "@/lib/system/enforce";
import { getPlanDefinitionResolved } from "@/lib/billing/catalog";

type EnforceBillingSuccess = {
  ok: true;
  user: IUser;
  usage: UsageConsumeResult;
};

type EnforceBillingFailure = {
  ok: false;
  response: NextResponse;
};

export async function enforceBillingUsage(
  request: Request,
  feature: BillingFeature
): Promise<EnforceBillingSuccess | EnforceBillingFailure> {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Authentication required. Please sign in to continue.",
        },
        { status: 401 }
      ),
    };
  }

  const systemAccess = await enforceSystemAccess({
    user,
    capability: "aiGeneration",
  });

  if (!systemAccess.ok) {
    return {
      ok: false,
      response: systemAccess.response,
    };
  }

  const usage = await consumeCreditsForUser({
    user: {
      ...user,
      // Developer users can test freely even if plan itself is limited.
      isUnlimitedAccess: user.isUnlimitedAccess || user.developerModeEnabled,
    },
    feature,
  });

  if (!usage.allowed) {
    const plan = await getPlanDefinitionResolved(user.planId);
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Rate limit reached for your current plan. Upgrade your plan or ask admin for higher limits.",
          usage,
          plan: {
            id: plan.id,
            name: plan.name,
            monthlyCredits: usage.monthlyLimit,
          },
        },
        { status: 429 }
      ),
    };
  }

  return {
    ok: true,
    user,
    usage,
  };
}
