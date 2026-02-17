import dbConnect from "@/lib/mongodb";
import AdminAuditLog from "@/lib/models/AdminAuditLog";

export async function createAdminAuditLog(params: {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { adminUserId, action, targetUserId, metadata } = params;

  await dbConnect();

  await AdminAuditLog.create({
    adminUserId,
    action,
    targetUserId,
    metadata,
  });
}
