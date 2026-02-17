import type { IUser } from "@/lib/models/User";
import {
  getPlanCyclePrice,
  type BillingCycle,
  type PlanId,
} from "@/lib/billing/plans";
import {
  getMonthlyCreditLimitResolved,
  getPlanDefinitionResolved,
} from "@/lib/billing/catalog";

export function getNextMonthlyRenewalDate(from = new Date()): Date {
  const renewalDate = new Date(from);
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  return renewalDate;
}

export function getNextYearlyRenewalDate(from = new Date()): Date {
  const renewalDate = new Date(from);
  renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  return renewalDate;
}

export async function getUserBillingSummary(
  user: Pick<
    IUser,
    | "planId"
    | "planStatus"
    | "planBillingCycle"
    | "rateLimitBonusCredits"
    | "customMonthlyCredits"
    | "isUnlimitedAccess"
    | "developerModeEnabled"
    | "accountStatus"
    | "sessionVersion"
    | "planStartedAt"
    | "planRenewalAt"
  >
) {
  const plan = await getPlanDefinitionResolved(user.planId);
  const monthlyCreditLimit = await getMonthlyCreditLimitResolved(user);
  const planBillingCycle: BillingCycle = user.planBillingCycle || "monthly";
  const cyclePrice = getPlanCyclePrice(plan, planBillingCycle);

  return {
    planId: plan.id,
    planName: plan.name,
    planDescription: plan.description,
    planStatus: user.planStatus || "active",
    planBillingCycle,
    monthlyCreditLimit,
    rateLimitBonusCredits: user.rateLimitBonusCredits || 0,
    customMonthlyCredits: user.customMonthlyCredits ?? null,
    isUnlimitedAccess: !!user.isUnlimitedAccess,
    developerModeEnabled: !!user.developerModeEnabled,
    accountStatus: user.accountStatus || "active",
    sessionVersion: user.sessionVersion || 1,
    planStartedAt: user.planStartedAt || null,
    planRenewalAt: user.planRenewalAt || null,
    monthlyPriceUsd: plan.monthlyPriceUsd,
    monthlyCompareAtUsd: plan.monthlyCompareAtUsd,
    yearlyPriceUsd: plan.yearlyPriceUsd,
    yearlyCompareAtUsd: plan.yearlyCompareAtUsd,
    currentCyclePriceUsd: cyclePrice.priceUsd,
    currentCycleCompareAtUsd: cyclePrice.compareAtUsd,
    currentCycleDiscountPercent: cyclePrice.discountPercent,
  };
}

export function getPaidPlanId(planId: string): PlanId | null {
  if (planId === "starter" || planId === "pro") {
    return planId;
  }

  return null;
}
