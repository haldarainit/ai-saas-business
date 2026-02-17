import dbConnect from "@/lib/mongodb";
import UserUsage from "@/lib/models/UserUsage";
import type { IUser } from "@/lib/models/User";
import {
  FEATURE_CREDIT_COST,
  type BillingFeature,
} from "@/lib/billing/plans";
import { getMonthlyCreditLimitResolved } from "@/lib/billing/catalog";

export interface UsageSnapshot {
  periodKey: string;
  monthlyLimit: number;
  isUnlimitedAccess: boolean;
  creditsUsed: number;
  remainingCredits: number;
  totalRequests: number;
  featureRequests: Record<string, number>;
}

export interface UsageConsumeResult extends UsageSnapshot {
  allowed: boolean;
  cost: number;
}

export function getCurrentPeriodKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function mapFeatureRequests(
  featureRequests?: Map<string, number>
): Record<string, number> {
  if (!featureRequests) {
    return {};
  }

  const mapped: Record<string, number> = {};

  for (const [key, value] of featureRequests.entries()) {
    mapped[key] = value;
  }

  return mapped;
}

export async function getUsageSnapshotForUser(
  user: Pick<
    IUser,
    "_id" | "planId" | "rateLimitBonusCredits" | "customMonthlyCredits" | "isUnlimitedAccess"
  >,
  periodKey = getCurrentPeriodKey()
): Promise<UsageSnapshot> {
  await dbConnect();

  const userId = String(user._id);
  const record = await UserUsage.findOne({ userId, periodKey });
  const monthlyLimit = await getMonthlyCreditLimitResolved(user);
  const creditsUsed = record?.totalCreditsUsed || 0;
  const remainingCredits = Math.max(0, monthlyLimit - creditsUsed);

  return {
    periodKey,
    monthlyLimit,
    isUnlimitedAccess: !!user.isUnlimitedAccess,
    creditsUsed,
    remainingCredits,
    totalRequests: record?.totalRequests || 0,
    featureRequests: mapFeatureRequests(record?.featureRequests),
  };
}

export async function consumeCreditsForUser(params: {
  user: Pick<
    IUser,
    "_id" | "planId" | "rateLimitBonusCredits" | "customMonthlyCredits" | "isUnlimitedAccess"
  >;
  feature: BillingFeature;
  cost?: number;
}): Promise<UsageConsumeResult> {
  const { user, feature } = params;
  const cost = params.cost ?? FEATURE_CREDIT_COST[feature];
  const periodKey = getCurrentPeriodKey();
  const userId = String(user._id);
  const monthlyLimit = await getMonthlyCreditLimitResolved(user);

  if (monthlyLimit <= 0 || cost > monthlyLimit) {
    const snapshot = await getUsageSnapshotForUser(user, periodKey);
    return {
      ...snapshot,
      allowed: false,
      cost,
    };
  }

  await dbConnect();

  const updateDoc = {
    $inc: {
      totalCreditsUsed: cost,
      totalRequests: 1,
      [`featureRequests.${feature}`]: 1,
    },
    $set: {
      lastUsedAt: new Date(),
    },
    $setOnInsert: {
      userId,
      periodKey,
    },
  };

  let updated = false;

  try {
    const result = await UserUsage.updateOne(
      { userId, periodKey, totalCreditsUsed: { $lte: monthlyLimit - cost } },
      updateDoc,
      { upsert: true }
    );

    updated = result.modifiedCount === 1 || result.upsertedCount === 1;
  } catch (error) {
    // Concurrent upsert can hit unique index; retry without upsert.
    const mongoError = error as { code?: number };

    if (mongoError.code === 11000) {
      const retry = await UserUsage.updateOne(
        { userId, periodKey, totalCreditsUsed: { $lte: monthlyLimit - cost } },
        updateDoc,
        { upsert: false }
      );

      updated = retry.modifiedCount === 1;
    } else {
      throw error;
    }
  }

  const snapshot = await getUsageSnapshotForUser(user, periodKey);

  return {
    ...snapshot,
    allowed: updated,
    cost,
  };
}
