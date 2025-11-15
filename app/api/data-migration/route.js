import DataMigrationUtil from "../../../lib/email/DataMigrationUtil";
import { extractUserFromRequest } from "../../../lib/auth-utils";

export async function POST(request) {
  try {
    // Extract user information from authentication token
    const authResult = extractUserFromRequest(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;
    const { action } = await request.json();

    const migrationUtil = new DataMigrationUtil();

    switch (action) {
      case "check":
        const checkResult = await migrationUtil.checkOldDataExists();
        return Response.json({ success: true, data: checkResult });

      case "migrate":
        const migrateResult = await migrationUtil.migrateFromFileSystem(userId);
        return Response.json(migrateResult);

      case "cleanup":
        const cleanupResult = await migrationUtil.cleanupOldData();
        return Response.json(cleanupResult);

      default:
        return Response.json(
          {
            success: false,
            error: "Invalid action. Use 'check', 'migrate', or 'cleanup'",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Data migration API error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
