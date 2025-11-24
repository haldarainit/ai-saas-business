import dbConnect from "../../../lib/mongodb.js";
import CampaignEmailHistory from "../../../lib/models/CampaignEmailHistory.js";
import { extractUserFromRequest } from "../../../lib/auth-utils.js";

export async function GET(request) {
  try {
    await dbConnect();

    // Extract user information from authentication token
    let userId = null;
    const authResult = extractUserFromRequest(request);
    if (authResult.success) {
      userId = authResult.user.id;
    } else {
      // For development: use a default user ID when no auth token
      userId =
        "dev-user-" +
        (process.env.NODE_ENV === "development" ? "default" : "anonymous");
      console.log("🔧 Development mode: using default user ID:", userId);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build query - filter by userId to show only user's emails
    const query = { userId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { recipientEmail: { $regex: search, $options: "i" } },
        { recipientName: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    console.log("📧 Fetching email history for userId:", userId);
    console.log("Query:", JSON.stringify(query));

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch email logs with pagination
    const [emailLogs, totalCount] = await Promise.all([
      CampaignEmailHistory.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("campaignId", "subject status")
        .lean(),
      CampaignEmailHistory.countDocuments(query),
    ]);

    console.log(`📊 Found ${totalCount} total emails for user`);

    // Get statistics for this user's emails
    const stats = await CampaignEmailHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return Response.json({
      success: true,
      data: {
        emailLogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          pageSize: limit,
        },
        stats: {
          total: totalCount,
          sent: statsMap.sent || 0,
          failed: statsMap.failed || 0,
          bounced: statsMap.bounced || 0,
          opened: statsMap.opened || 0,
          clicked: statsMap.clicked || 0,
        },
      },
    });
  } catch (error) {
    console.error("Email history API error:", error);
    return Response.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
