import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import UserUsage from "@/lib/models/UserUsage";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getCurrentPeriodKey } from "@/lib/billing/usage";
import {
  BILLING_PLAN_ORDER,
  type BillingCycle,
  isPlanId,
} from "@/lib/billing/plans";
import { getUserBillingSummary } from "@/lib/billing/subscription";
import { createAdminAuditLog } from "@/lib/admin/audit";
import { enforceRateLimit, getClientIpAddress } from "@/lib/security/rate-limit";
import { getPlanDefinitionResolved } from "@/lib/billing/catalog";

export async function GET(request: Request) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    await dbConnect();
    const url = new URL(request.url);
    const periodKey = url.searchParams.get("periodKey") || getCurrentPeriodKey();

    const users = await User.find({})
      .select(
        "name email role planId planBillingCycle planStatus rateLimitBonusCredits customMonthlyCredits isUnlimitedAccess developerModeEnabled accountStatus suspendedReason sessionVersion lastLoginAt planStartedAt planRenewalAt createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(300);

    const userIds = users.map((user) => String(user._id));
    const usageRows = await UserUsage.find({ periodKey, userId: { $in: userIds } });
    const usageMap = new Map<string, (typeof usageRows)[number]>();

    for (const row of usageRows) {
      usageMap.set(row.userId, row);
    }

    const responseUsers = await Promise.all(
      users.map(async (user) => {
        const usage = usageMap.get(String(user._id));
        const billing = await getUserBillingSummary(user);
        const creditsUsed = usage?.totalCreditsUsed || 0;

        return {
          id: String(user._id),
          name: user.name || "",
          email: user.email,
          role: user.role || "user",
          billing,
          security: {
            suspendedReason: user.suspendedReason || null,
            lastLoginAt: user.lastLoginAt || null,
          },
          usage: {
            periodKey,
            creditsUsed,
            remainingCredits: Math.max(0, billing.monthlyCreditLimit - creditsUsed),
            totalRequests: usage?.totalRequests || 0,
            featureRequests: usage?.featureRequests
              ? Object.fromEntries(usage.featureRequests.entries())
              : {},
          },
          createdAt: user.createdAt,
        };
      })
    );

    return NextResponse.json({
      periodKey,
      planIds: BILLING_PLAN_ORDER,
      users: responseUsers,
    });
  } catch (error) {
    console.error("Error fetching admin billing users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

interface UpdateBillingBody {
  userId: string;
  planId?: string;
  role?: "user" | "admin";
  planStatus?: "active" | "past_due" | "cancelled" | "trial";
  planBillingCycle?: BillingCycle;
  rateLimitBonusCredits?: number;
  customMonthlyCredits?: number | null;
  isUnlimitedAccess?: boolean;
  developerModeEnabled?: boolean;
  accountStatus?: "active" | "suspended";
  suspendedReason?: string | null;
  forceSessionRefresh?: boolean;
  resetCurrentUsage?: boolean;
}

export async function PATCH(request: Request) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimit = enforceRateLimit({
      key: `admin-billing:${ipAddress}`,
      windowMs: 5 * 60 * 1000,
      maxRequests: 500,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many admin updates. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as UpdateBillingBody;

    if (!body.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const updateDoc: Record<string, unknown> = {};
    let shouldUnsetSuspendedReason = false;

    if (body.planId !== undefined) {
      if (!isPlanId(body.planId)) {
        return NextResponse.json(
          { error: `Invalid planId. Use one of: ${BILLING_PLAN_ORDER.join(", ")}` },
          { status: 400 }
        );
      }
      updateDoc.planId = body.planId;
      updateDoc.planStatus = body.planStatus || "active";
      updateDoc.planStartedAt = new Date();
      updateDoc.planBillingCycle = body.planBillingCycle || "monthly";
    } else if (body.planStatus) {
      updateDoc.planStatus = body.planStatus;
    }

    if (body.planBillingCycle !== undefined) {
      if (body.planBillingCycle !== "monthly" && body.planBillingCycle !== "yearly") {
        return NextResponse.json(
          { error: "planBillingCycle must be monthly or yearly" },
          { status: 400 }
        );
      }
      updateDoc.planBillingCycle = body.planBillingCycle;
    }

    if (body.role) {
      if (
        String(adminCheck.user._id) === body.userId &&
        body.role !== "admin"
      ) {
        return NextResponse.json(
          { error: "You cannot remove your own admin role." },
          { status: 400 }
        );
      }

      updateDoc.role = body.role;
    }

    if (body.rateLimitBonusCredits !== undefined) {
      if (
        !Number.isFinite(body.rateLimitBonusCredits) ||
        body.rateLimitBonusCredits < 0
      ) {
        return NextResponse.json(
          { error: "rateLimitBonusCredits cannot be negative" },
          { status: 400 }
        );
      }
      updateDoc.rateLimitBonusCredits = body.rateLimitBonusCredits;
    }

    if (body.customMonthlyCredits !== undefined) {
      if (
        body.customMonthlyCredits !== null &&
        (!Number.isFinite(body.customMonthlyCredits) ||
          body.customMonthlyCredits < 0)
      ) {
        return NextResponse.json(
          { error: "customMonthlyCredits cannot be negative" },
          { status: 400 }
        );
      }
      updateDoc.customMonthlyCredits = body.customMonthlyCredits;
    }

    if (body.isUnlimitedAccess !== undefined) {
      updateDoc.isUnlimitedAccess = !!body.isUnlimitedAccess;
    }

    if (body.developerModeEnabled !== undefined) {
      updateDoc.developerModeEnabled = !!body.developerModeEnabled;
    }

    if (body.accountStatus !== undefined) {
      if (
        String(adminCheck.user._id) === body.userId &&
        body.accountStatus === "suspended"
      ) {
        return NextResponse.json(
          { error: "You cannot suspend your own account." },
          { status: 400 }
        );
      }

      if (!["active", "suspended"].includes(body.accountStatus)) {
        return NextResponse.json(
          { error: "accountStatus must be active or suspended" },
          { status: 400 }
        );
      }

      updateDoc.accountStatus = body.accountStatus;
      if (body.accountStatus === "active") {
        shouldUnsetSuspendedReason = true;
      }
    }

    if (body.suspendedReason !== undefined) {
      const normalizedReason =
        body.suspendedReason && body.suspendedReason.trim()
          ? body.suspendedReason.trim()
          : "";

      if (normalizedReason) {
        updateDoc.suspendedReason = normalizedReason;
      } else {
        shouldUnsetSuspendedReason = true;
      }
    }

    await dbConnect();

    const hasSetUpdates = Object.keys(updateDoc).length > 0;
    if (
      !hasSetUpdates &&
      !body.forceSessionRefresh &&
      !shouldUnsetSuspendedReason &&
      !body.resetCurrentUsage
    ) {
      return NextResponse.json(
        { error: "No update fields provided." },
        { status: 400 }
      );
    }

    const mongoUpdate: Record<string, unknown> = {};
    if (hasSetUpdates) {
      mongoUpdate.$set = updateDoc;
    }

    if (body.forceSessionRefresh) {
      mongoUpdate.$inc = { sessionVersion: 1 };
    }

    if (shouldUnsetSuspendedReason) {
      mongoUpdate.$unset = { suspendedReason: 1 };
    }

    const userSelection =
      "name email role planId planBillingCycle planStatus rateLimitBonusCredits customMonthlyCredits isUnlimitedAccess developerModeEnabled accountStatus suspendedReason sessionVersion lastLoginAt planStartedAt planRenewalAt createdAt";

    const user =
      Object.keys(mongoUpdate).length > 0
        ? await User.findByIdAndUpdate(body.userId, mongoUpdate, {
            new: true,
          }).select(userSelection)
        : await User.findById(body.userId).select(userSelection);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.resetCurrentUsage) {
      await UserUsage.deleteOne({
        userId: String(user._id),
        periodKey: getCurrentPeriodKey(),
      });
    }

    const billing = await getUserBillingSummary(user);
    const adminUserId = String(adminCheck.user._id);
    const selectedPlan = await getPlanDefinitionResolved(user.planId);

    await createAdminAuditLog({
      adminUserId,
      action: "admin.user.updated",
      targetUserId: String(user._id),
      metadata: {
        updates: updateDoc,
        forceSessionRefresh: !!body.forceSessionRefresh,
        resetCurrentUsage: !!body.resetCurrentUsage,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name || "",
        email: user.email,
        role: user.role || "user",
        billing,
        security: {
          suspendedReason: user.suspendedReason || null,
          lastLoginAt: user.lastLoginAt || null,
        },
      },
      selectedPlan,
    });
  } catch (error) {
    console.error("Error updating billing user:", error);
    return NextResponse.json(
      { error: "Failed to update user billing configuration" },
      { status: 500 }
    );
  }
}
