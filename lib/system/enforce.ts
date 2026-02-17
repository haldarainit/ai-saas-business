import { NextResponse } from "next/server";
import type { IUser } from "@/lib/models/User";
import { getSystemControlState, type SystemControlState } from "@/lib/system/control";

export type SystemCapability =
  | "signup"
  | "payments"
  | "aiGeneration"
  | "deployments";

type SystemAccessSuccess = {
  ok: true;
  control: SystemControlState;
};

type SystemAccessFailure = {
  ok: false;
  control: SystemControlState;
  response: NextResponse;
};

export type SystemAccessResult = SystemAccessSuccess | SystemAccessFailure;

function getCapabilityFlag(capability: SystemCapability) {
  if (capability === "signup") return "signupEnabled";
  if (capability === "payments") return "paymentsEnabled";
  if (capability === "aiGeneration") return "aiGenerationEnabled";
  return "deploymentsEnabled";
}

function isDeveloperOrAdmin(user?: Pick<IUser, "role" | "developerModeEnabled"> | null) {
  if (!user) return false;
  return user.role === "admin" || !!user.developerModeEnabled;
}

function isAdmin(user?: Pick<IUser, "role"> | null) {
  return !!user && user.role === "admin";
}

function getCapabilityMessage(capability: SystemCapability) {
  if (capability === "signup") {
    return "New account registration is currently disabled by admin.";
  }

  if (capability === "payments") {
    return "Payments are temporarily disabled by admin.";
  }

  if (capability === "aiGeneration") {
    return "AI generation is temporarily disabled by admin.";
  }

  return "Deployments are temporarily disabled by admin.";
}

export async function enforceSystemAccess(params: {
  user?: Pick<IUser, "role" | "developerModeEnabled"> | null;
  capability?: SystemCapability;
}): Promise<SystemAccessResult> {
  const { user, capability } = params;
  const control = await getSystemControlState();

  if (control.maintenanceMode && !isDeveloperOrAdmin(user)) {
    return {
      ok: false,
      control,
      response: NextResponse.json(
        {
          error: "System is in maintenance mode. Please try again later.",
        },
        { status: 503 }
      ),
    };
  }

  if (control.adminOnlyMode && !isAdmin(user)) {
    return {
      ok: false,
      control,
      response: NextResponse.json(
        {
          error: "System is currently in admin-only mode.",
        },
        { status: 403 }
      ),
    };
  }

  if (!capability) {
    return { ok: true, control };
  }

  const capabilityFlag = getCapabilityFlag(capability);
  if (!control[capabilityFlag] && !isDeveloperOrAdmin(user)) {
    return {
      ok: false,
      control,
      response: NextResponse.json(
        { error: getCapabilityMessage(capability) },
        { status: 503 }
      ),
    };
  }

  return { ok: true, control };
}
