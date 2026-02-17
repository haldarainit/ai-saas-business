import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getSystemControlState,
  updateSystemControlState,
  type SystemControlState,
} from "@/lib/system/control";
import { createAdminAuditLog } from "@/lib/admin/audit";
import { enforceRateLimit, getClientIpAddress } from "@/lib/security/rate-limit";

type SystemControlBooleanKey =
  | "maintenanceMode"
  | "signupEnabled"
  | "paymentsEnabled"
  | "aiGenerationEnabled"
  | "deploymentsEnabled"
  | "adminOnlyMode";

const ALLOWED_KEYS: SystemControlBooleanKey[] = [
  "maintenanceMode",
  "signupEnabled",
  "paymentsEnabled",
  "aiGenerationEnabled",
  "deploymentsEnabled",
  "adminOnlyMode",
];

export async function GET(request: Request) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const control = await getSystemControlState();
    return NextResponse.json({ control });
  } catch (error) {
    console.error("Failed to load system control:", error);
    return NextResponse.json(
      { error: "Failed to load system control state" },
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
      key: `admin-system:${ipAddress}`,
      windowMs: 5 * 60 * 1000,
      maxRequests: 200,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many admin updates. Please wait a moment." },
        { status: 429 }
      );
    }

    const payload = (await request.json()) as Partial<SystemControlState>;
    const patch: Partial<Record<SystemControlBooleanKey, boolean>> = {};

    for (const key of ALLOWED_KEYS) {
      const value = payload[key];
      if (value !== undefined) {
        if (typeof value !== "boolean") {
          return NextResponse.json(
            { error: `${key} must be a boolean` },
            { status: 400 }
          );
        }

        patch[key] = value;
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid system control fields provided" },
        { status: 400 }
      );
    }

    const control = await updateSystemControlState({
      patch,
      updatedBy: String(adminCheck.user._id),
    });

    await createAdminAuditLog({
      adminUserId: String(adminCheck.user._id),
      action: "admin.system.updated",
      metadata: {
        patch,
      },
    });

    return NextResponse.json({
      success: true,
      control,
    });
  } catch (error) {
    console.error("Failed to update system control:", error);
    return NextResponse.json(
      { error: "Failed to update system control state" },
      { status: 500 }
    );
  }
}
