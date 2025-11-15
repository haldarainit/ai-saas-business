import initializeDatabase from "../../../scripts/init-database";

export async function POST(request) {
  try {
    const result = await initializeDatabase();

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

export async function GET() {
  try {
    // Just return database status without initializing
    const result = await initializeDatabase();
    return Response.json(result);
  } catch (error) {
    console.error("Database status error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
