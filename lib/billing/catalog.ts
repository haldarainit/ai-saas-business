import dbConnect from "@/lib/mongodb";
import PricingConfig from "@/lib/models/PricingConfig";
import type { IUser } from "@/lib/models/User";
import {
  BILLING_PLAN_ORDER,
  BILLING_PLANS,
  DEFAULT_CURRENCY,
  DEFAULT_PLAN_ID,
  UNLIMITED_CREDIT_LIMIT,
  getPlanDefinition,
  isPlanId,
  normalizePlanDefinition,
  type PlanDefinition,
  type PlanId,
} from "@/lib/billing/plans";

type CatalogPlans = Record<PlanId, PlanDefinition>;

export interface BillingCatalog {
  currency: string;
  plans: CatalogPlans;
  updatedBy?: string;
  updatedAt?: Date | null;
}

type UserBillingLimitInput = Pick<
  IUser,
  "planId" | "rateLimitBonusCredits" | "customMonthlyCredits" | "isUnlimitedAccess"
>;

const CACHE_TTL_MS = 60 * 1000;

let catalogCache:
  | {
      expiresAt: number;
      value: BillingCatalog;
    }
  | null = null;

function getDefaultCatalog(): BillingCatalog {
  return {
    currency: DEFAULT_CURRENCY,
    plans: BILLING_PLAN_ORDER.reduce((acc, planId) => {
      acc[planId] = BILLING_PLANS[planId];
      return acc;
    }, {} as CatalogPlans),
    updatedBy: undefined,
    updatedAt: null,
  };
}

export function clearBillingCatalogCache() {
  catalogCache = null;
}

export async function getBillingCatalog(forceRefresh = false): Promise<BillingCatalog> {
  const now = Date.now();

  if (!forceRefresh && catalogCache && catalogCache.expiresAt > now) {
    return catalogCache.value;
  }

  await dbConnect();

  const config = (await PricingConfig.findOne({
    singletonKey: "global",
  }).lean()) as
    | {
        currency?: string;
        plans?: Partial<Record<PlanId, Partial<PlanDefinition>>>;
        updatedBy?: string;
        updatedAt?: Date;
      }
    | null;
  const defaults = getDefaultCatalog();

  if (!config) {
    catalogCache = {
      value: defaults,
      expiresAt: now + CACHE_TTL_MS,
    };
    return defaults;
  }

  const plans = BILLING_PLAN_ORDER.reduce((acc, planId) => {
    const override = config.plans?.[planId] || {};
    acc[planId] = normalizePlanDefinition(planId, {
      ...BILLING_PLANS[planId],
      ...override,
      id: planId,
    });
    return acc;
  }, {} as CatalogPlans);

  const catalog: BillingCatalog = {
    currency: (config.currency || DEFAULT_CURRENCY).toUpperCase(),
    plans,
    updatedBy: config.updatedBy,
    updatedAt: config.updatedAt || null,
  };

  catalogCache = {
    value: catalog,
    expiresAt: now + CACHE_TTL_MS,
  };

  return catalog;
}

export async function getPlanDefinitionResolved(
  planId?: string | null
): Promise<PlanDefinition> {
  const catalog = await getBillingCatalog();

  if (!planId || !isPlanId(planId)) {
    return catalog.plans[DEFAULT_PLAN_ID];
  }

  return catalog.plans[planId] || getPlanDefinition(planId);
}

export async function getMonthlyCreditLimitResolved(
  user: UserBillingLimitInput
): Promise<number> {
  if (user.isUnlimitedAccess) {
    return UNLIMITED_CREDIT_LIMIT;
  }

  const plan = await getPlanDefinitionResolved(user.planId);
  const bonus = user.rateLimitBonusCredits || 0;
  const customCredits = user.customMonthlyCredits;

  const baseLimit =
    typeof customCredits === "number" && customCredits >= 0
      ? customCredits
      : plan.monthlyCredits;

  return Math.max(0, baseLimit + bonus);
}
