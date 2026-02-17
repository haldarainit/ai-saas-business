import mongoose from "mongoose";

export interface IAdminAuditLog extends mongoose.Document {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const adminAuditLogSchema = new mongoose.Schema<IAdminAuditLog>(
  {
    adminUserId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetUserId: {
      type: String,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

adminAuditLogSchema.index({ createdAt: -1 });

const AdminAuditLog =
  mongoose.models.AdminAuditLog ||
  mongoose.model<IAdminAuditLog>("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
