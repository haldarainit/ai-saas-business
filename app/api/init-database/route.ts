import initializeDatabase from "../../../scripts/init-database";

interface InitResult {
    success: boolean;
    error?: string;
    statistics?: {
        users: number;
        campaigns: number;
        emailLogs: number;
        collections: string[];
    };
}

export async function POST(): Promise<Response> {
    try {
        const result = await initializeDatabase() as InitResult;

        if (result.success) {
            return Response.json({
                success: true,
                message: "Database initialized successfully",
                ...result,
            });
        } else {
            return Response.json(
                {
                    success: false,
                    error: result.error,
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Database initialization API error:", error);
        return Response.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(): Promise<Response> {
    try {
        // Just return database status without initializing
        const result = await initializeDatabase() as InitResult;
        return Response.json(result);
    } catch (error) {
        console.error("Database status error:", error);
        return Response.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
