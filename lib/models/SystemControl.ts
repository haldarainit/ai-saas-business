import mongoose from "mongoose";

export interface ISystemControl extends mongoose.Document {
  singletonKey: "global";
  maintenanceMode: boolean;
  signupEnabled: boolean;
  paymentsEnabled: boolean;
  aiGenerationEnabled: boolean;
  deploymentsEnabled: boolean;
  adminOnlyMode: boolean;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const systemControlSchema = new mongoose.Schema<ISystemControl>(
  {
    singletonKey: {
      type: String,
      enum: ["global"],
      default: "global",
      unique: true,
      index: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    signupEnabled: {
      type: Boolean,
      default: true,
    },
    paymentsEnabled: {
      type: Boolean,
      default: true,
    },
    aiGenerationEnabled: {
      type: Boolean,
      default: true,
    },
    deploymentsEnabled: {
      type: Boolean,
      default: true,
    },
    adminOnlyMode: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const SystemControl =
  mongoose.models.SystemControl ||
  mongoose.model<ISystemControl>("SystemControl", systemControlSchema);

export default SystemControl;
