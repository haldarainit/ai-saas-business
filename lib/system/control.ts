import dbConnect from "@/lib/mongodb";
import SystemControl from "@/lib/models/SystemControl";

export interface SystemControlState {
  maintenanceMode: boolean;
  signupEnabled: boolean;
  paymentsEnabled: boolean;
  aiGenerationEnabled: boolean;
  deploymentsEnabled: boolean;
  adminOnlyMode: boolean;
  updatedBy?: string;
  updatedAt?: Date;
}

export const DEFAULT_SYSTEM_CONTROL: SystemControlState = {
  maintenanceMode: false,
  signupEnabled: true,
  paymentsEnabled: true,
  aiGenerationEnabled: true,
  deploymentsEnabled: true,
  adminOnlyMode: false,
};

export async function getSystemControlState(): Promise<SystemControlState> {
  await dbConnect();

  const control = await SystemControl.findOne({ singletonKey: "global" });

  if (!control) {
    return DEFAULT_SYSTEM_CONTROL;
  }

  return {
    maintenanceMode: !!control.maintenanceMode,
    signupEnabled: !!control.signupEnabled,
    paymentsEnabled: !!control.paymentsEnabled,
    aiGenerationEnabled: !!control.aiGenerationEnabled,
    deploymentsEnabled: !!control.deploymentsEnabled,
    adminOnlyMode: !!control.adminOnlyMode,
    updatedBy: control.updatedBy,
    updatedAt: control.updatedAt,
  };
}

export async function updateSystemControlState(params: {
  patch: Partial<SystemControlState>;
  updatedBy: string;
}): Promise<SystemControlState> {
  await dbConnect();

  const { patch, updatedBy } = params;

  const control = await SystemControl.findOneAndUpdate(
    { singletonKey: "global" },
    {
      $set: {
        ...patch,
        updatedBy,
      },
      $setOnInsert: {
        singletonKey: "global",
      },
    },
    { upsert: true, new: true }
  );

  return {
    maintenanceMode: !!control.maintenanceMode,
    signupEnabled: !!control.signupEnabled,
    paymentsEnabled: !!control.paymentsEnabled,
    aiGenerationEnabled: !!control.aiGenerationEnabled,
    deploymentsEnabled: !!control.deploymentsEnabled,
    adminOnlyMode: !!control.adminOnlyMode,
    updatedBy: control.updatedBy,
    updatedAt: control.updatedAt,
  };
}
