import { NextRequest } from 'next/server';
import DataMigrationUtil from "../../../lib/email/DataMigrationUtil";
import { getAuthenticatedUser } from "../../../lib/get-auth-user";

interface RequestBody {
    action: 'check' | 'migrate' | 'cleanup';
}

export async function POST(request: NextRequest): Promise<Response> {
    try {
        // Extract user information from authentication - supports both Google OAuth and email/password login
        const authResult = await getAuthenticatedUser(request);
        const userId = authResult.userId;

        if (!userId) {
            console.error("❌ No authenticated user found for data-migration request");
            return Response.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }
        const { action } = await request.json() as RequestBody;

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
