import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { enforceRateLimit, getClientIpAddress } from "@/lib/security/rate-limit";
import { createAdminAuditLog } from "@/lib/admin/audit";
import PricingConfig from "@/lib/models/PricingConfig";
import dbConnect from "@/lib/mongodb";
import {
  BILLING_PLAN_ORDER,
  type PlanId,
  type PlanDefinition,
} from "@/lib/billing/plans";
import { clearBillingCatalogCache, getBillingCatalog } from "@/lib/billing/catalog";

type AdminPlanPatch = Partial<
  Pick<
    PlanDefinition,
    | "name"
    | "description"
    | "monthlyCredits"
    | "monthlyPriceUsd"
    | "monthlyCompareAtUsd"
    | "yearlyPriceUsd"
    | "yearlyCompareAtUsd"
    | "isContactSales"
  >
>;

interface PricingPatchBody {
  currency?: string;
  plans?: Partial<Record<PlanId, AdminPlanPatch>>;
}

function validateNonNegativeNumber(value: unknown, field: string) {
  if (value === undefined || value === null) return;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
}

function normalizeCurrency(currency?: string) {
  if (!currency) return undefined;
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error("currency must be a valid 3-letter code (e.g., USD)");
  }
  return normalized;
}

export async function GET(request: Request) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const catalog = await getBillingCatalog(true);
    return NextResponse.json({
      currency: catalog.currency,
      plans: catalog.plans,
      updatedBy: catalog.updatedBy || null,
      updatedAt: catalog.updatedAt || null,
    });
  } catch (error) {
    console.error("Failed to fetch billing plan config:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing plan config" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimit = enforceRateLimit({
      key: `admin-billing-plans:${ipAddress}`,
      windowMs: 5 * 60 * 1000,
      maxRequests: 200,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many plan updates. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as PricingPatchBody;
    const updateSet: Record<string, unknown> = {};
    const updateUnset: Record<string, unknown> = {};

    const normalizedCurrency = normalizeCurrency(body.currency);
    if (normalizedCurrency) {
      updateSet.currency = normalizedCurrency;
    }

    const planPatches = body.plans || {};
    for (const planId of BILLING_PLAN_ORDER) {
      const patch = planPatches[planId];
      if (!patch) continue;

      if (patch.name !== undefined) {
        const value = String(patch.name || "").trim();
        if (!value) {
          throw new Error(`${planId}.name cannot be empty`);
        }
        updateSet[`plans.${planId}.name`] = value;
      }

      if (patch.description !== undefined) {
        const value = String(patch.description || "").trim();
        if (!value) {
          throw new Error(`${planId}.description cannot be empty`);
        }
        updateSet[`plans.${planId}.description`] = value;
      }

      if (patch.monthlyCredits !== undefined) {
        validateNonNegativeNumber(patch.monthlyCredits, `${planId}.monthlyCredits`);
        updateSet[`plans.${planId}.monthlyCredits`] = Math.floor(
          Number(patch.monthlyCredits)
        );
      }

      if (patch.monthlyPriceUsd !== undefined) {
        validateNonNegativeNumber(patch.monthlyPriceUsd, `${planId}.monthlyPriceUsd`);
        updateSet[`plans.${planId}.monthlyPriceUsd`] = Number(patch.monthlyPriceUsd);
      }

      if (patch.yearlyPriceUsd !== undefined) {
        validateNonNegativeNumber(patch.yearlyPriceUsd, `${planId}.yearlyPriceUsd`);
        updateSet[`plans.${planId}.yearlyPriceUsd`] = Number(patch.yearlyPriceUsd);
      }

      if (patch.monthlyCompareAtUsd !== undefined) {
        if (patch.monthlyCompareAtUsd === null) {
          updateUnset[`plans.${planId}.monthlyCompareAtUsd`] = 1;
        } else {
          validateNonNegativeNumber(
            patch.monthlyCompareAtUsd,
            `${planId}.monthlyCompareAtUsd`
          );
          updateSet[`plans.${planId}.monthlyCompareAtUsd`] = Number(
            patch.monthlyCompareAtUsd
          );
        }
      }

      if (patch.yearlyCompareAtUsd !== undefined) {
        if (patch.yearlyCompareAtUsd === null) {
          updateUnset[`plans.${planId}.yearlyCompareAtUsd`] = 1;
        } else {
          validateNonNegativeNumber(
            patch.yearlyCompareAtUsd,
            `${planId}.yearlyCompareAtUsd`
          );
          updateSet[`plans.${planId}.yearlyCompareAtUsd`] = Number(
            patch.yearlyCompareAtUsd
          );
        }
      }

      if (patch.isContactSales !== undefined) {
        updateSet[`plans.${planId}.isContactSales`] = !!patch.isContactSales;
      }
    }

    if (Object.keys(updateSet).length === 0 && Object.keys(updateUnset).length === 0) {
      return NextResponse.json(
        { error: "No valid plan updates provided" },
        { status: 400 }
      );
    }

    await dbConnect();

    const updateDoc: Record<string, unknown> = {
      $set: {
        ...updateSet,
        updatedBy: String(adminCheck.user._id),
      },
      $setOnInsert: {
        singletonKey: "global",
      },
    };

    if (Object.keys(updateUnset).length > 0) {
      updateDoc.$unset = updateUnset;
    }

    await PricingConfig.findOneAndUpdate(
      { singletonKey: "global" },
      updateDoc,
      { new: true, upsert: true }
    );

    clearBillingCatalogCache();
    const catalog = await getBillingCatalog(true);

    await createAdminAuditLog({
      adminUserId: String(adminCheck.user._id),
      action: "admin.billing.plans.updated",
      metadata: {
        currency: normalizedCurrency,
        updatedFields: Object.keys(updateSet),
      },
    });

    return NextResponse.json({
      success: true,
      currency: catalog.currency,
      plans: catalog.plans,
      updatedBy: catalog.updatedBy || null,
      updatedAt: catalog.updatedAt || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update plans";
    console.error("Failed to update billing plan config:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
