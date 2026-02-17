export type PlanId = "free" | "starter" | "pro" | "custom";
export type BillingCycle = "monthly" | "yearly";

export type BillingFeature =
  | "ai_generate"
  | "image_generate"
  | "sales_script"
  | "presentation_generate"
  | "strategy_generate"
  | "action_plan_generate";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  monthlyPriceUsd: number;
  monthlyCompareAtUsd: number | null;
  yearlyPriceUsd: number;
  yearlyCompareAtUsd: number | null;
  monthlyCredits: number;
  isContactSales?: boolean;
}

export interface PlanCyclePrice {
  billingCycle: BillingCycle;
  priceUsd: number;
  compareAtUsd: number | null;
  discountPercent: number;
}

export const DEFAULT_PLAN_ID: PlanId = "free";
export const DEFAULT_CURRENCY = "USD";
export const UNLIMITED_CREDIT_LIMIT = 999_999_999;

export const BILLING_PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "custom"];

export const BILLING_PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "Try the platform with essential AI tools.",
    monthlyPriceUsd: 0,
    monthlyCompareAtUsd: null,
    yearlyPriceUsd: 0,
    yearlyCompareAtUsd: null,
    monthlyCredits: 40,
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For solopreneurs and small teams.",
    monthlyPriceUsd: 4,
    monthlyCompareAtUsd: 8,
    yearlyPriceUsd: 40,
    yearlyCompareAtUsd: 48,
    monthlyCredits: 250,
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For growing businesses with high AI usage.",
    monthlyPriceUsd: 15,
    monthlyCompareAtUsd: null,
    yearlyPriceUsd: 150,
    yearlyCompareAtUsd: 180,
    monthlyCredits: 1200,
  },
  custom: {
    id: "custom",
    name: "Custom",
    description: "Custom limits and priority support for larger teams.",
    monthlyPriceUsd: 0,
    monthlyCompareAtUsd: null,
    yearlyPriceUsd: 0,
    yearlyCompareAtUsd: null,
    monthlyCredits: 3000,
    isContactSales: true,
  },
};

export const FEATURE_CREDIT_COST: Record<BillingFeature, number> = {
  ai_generate: 1,
  image_generate: 2,
  sales_script: 1,
  presentation_generate: 3,
  strategy_generate: 2,
  action_plan_generate: 2,
};

export function isPlanId(value: string): value is PlanId {
  return BILLING_PLAN_ORDER.includes(value as PlanId);
}

export function normalizePlanDefinition(
  planId: PlanId,
  input: Partial<PlanDefinition>
): PlanDefinition {
  const fallback = BILLING_PLANS[planId];
  const normalizedMonthlyPrice =
    typeof input.monthlyPriceUsd === "number" && input.monthlyPriceUsd >= 0
      ? input.monthlyPriceUsd
      : fallback.monthlyPriceUsd;
  const normalizedYearlyPrice =
    typeof input.yearlyPriceUsd === "number" && input.yearlyPriceUsd >= 0
      ? input.yearlyPriceUsd
      : fallback.yearlyPriceUsd;
  const normalizedMonthlyCompareAt =
    typeof input.monthlyCompareAtUsd === "number" && input.monthlyCompareAtUsd >= 0
      ? input.monthlyCompareAtUsd
      : null;
  const normalizedYearlyCompareAt =
    typeof input.yearlyCompareAtUsd === "number" && input.yearlyCompareAtUsd >= 0
      ? input.yearlyCompareAtUsd
      : null;
  const monthlyCompareAt =
    normalizedMonthlyCompareAt !== null &&
    normalizedMonthlyCompareAt > normalizedMonthlyPrice
      ? normalizedMonthlyCompareAt
      : null;
  const yearlyCompareAt =
    normalizedYearlyCompareAt !== null &&
    normalizedYearlyCompareAt > normalizedYearlyPrice
      ? normalizedYearlyCompareAt
      : null;

  return {
    id: planId,
    name: (input.name || fallback.name).trim(),
    description: (input.description || fallback.description).trim(),
    monthlyPriceUsd: normalizedMonthlyPrice,
    monthlyCompareAtUsd: monthlyCompareAt,
    yearlyPriceUsd: normalizedYearlyPrice,
    yearlyCompareAtUsd: yearlyCompareAt,
    monthlyCredits:
      typeof input.monthlyCredits === "number" && input.monthlyCredits >= 0
        ? Math.floor(input.monthlyCredits)
        : fallback.monthlyCredits,
    isContactSales:
      typeof input.isContactSales === "boolean"
        ? input.isContactSales
        : !!fallback.isContactSales,
  };
}

export function getPlanDefinition(planId?: string | null): PlanDefinition {
  if (!planId || !isPlanId(planId)) {
    return BILLING_PLANS[DEFAULT_PLAN_ID];
  }

  return BILLING_PLANS[planId];
}

export function getMonthlyCreditLimit(user: {
  planId?: string | null;
  rateLimitBonusCredits?: number | null;
  customMonthlyCredits?: number | null;
  isUnlimitedAccess?: boolean | null;
}): number {
  if (user.isUnlimitedAccess) {
    return UNLIMITED_CREDIT_LIMIT;
  }

  const basePlan = getPlanDefinition(user.planId);
  const customCredits = user.customMonthlyCredits;
  const bonus = user.rateLimitBonusCredits || 0;

  const baseLimit =
    typeof customCredits === "number" && customCredits >= 0
      ? customCredits
      : basePlan.monthlyCredits;

  return Math.max(0, baseLimit + bonus);
}

export function getDiscountPercent(priceUsd: number, compareAtUsd?: number | null) {
  if (!compareAtUsd || compareAtUsd <= 0 || compareAtUsd <= priceUsd) {
    return 0;
  }

  return Math.round(((compareAtUsd - priceUsd) / compareAtUsd) * 100);
}

export function getPlanCyclePrice(
  plan: PlanDefinition,
  billingCycle: BillingCycle
): PlanCyclePrice {
  const isYearly = billingCycle === "yearly";
  const priceUsd = isYearly ? plan.yearlyPriceUsd : plan.monthlyPriceUsd;
  const compareAtUsd = isYearly
    ? plan.yearlyCompareAtUsd
    : plan.monthlyCompareAtUsd;

  return {
    billingCycle,
    priceUsd,
    compareAtUsd,
    discountPercent: getDiscountPercent(priceUsd, compareAtUsd),
  };
}
