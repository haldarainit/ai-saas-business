import dbConnect from "../../../lib/mongodb.js";
import CampaignEmailHistory from "../../../lib/models/CampaignEmailHistory.js";
import CampaignStorage from "../../../lib/email/CampaignStorage.js";
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
    const type = searchParams.get("type"); // 'campaigns' or 'logs' (default)
    const campaignId = searchParams.get("campaignId");

    // Initialize storage
    const storage = new CampaignStorage(userId);

    // Handle Campaign List Request
    if (type === "campaigns") {
      console.log("📧 Fetching campaigns for userId:", userId);

      const result = await storage.getCampaigns(limit, (page - 1) * limit, status);

      if (!result.success) {
        throw new Error(result.error);
      }

      return Response.json({
        success: true,
        data: {
          campaigns: result.data,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(result.totalCount / limit),
            totalCount: result.totalCount,
            pageSize: limit,
          },
        },
      });
    }

    // Handle Email Logs Request (Default)
    // Build query - filter by userId to show only user's emails
    const query = { userId };

    if (campaignId) {
      query.campaignId = campaignId;
    }

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

    // Get statistics for this user's emails (filtered by campaign if provided)
    const statsMatch = { userId };
    if (campaignId) {
      // Convert string ID to ObjectId if needed, though mongoose usually handles string IDs in match
      // But for aggregation $match, we might need to be careful. 
      // Ideally, we should cast to ObjectId if it's stored as ObjectId.
      // However, CampaignEmailHistory schema defines campaignId as ObjectId.
      // Let's rely on mongoose casting or simple string match if it works, 
      // but aggregation usually requires correct types.
      // For safety, we'll skip strict casting here as we are in a simple flow, 
      // but in production we might need `new mongoose.Types.ObjectId(campaignId)`.
      // Let's try simple string match first, or just filter by what we have.
      // Actually, let's just use the query object we built above for count, 
      // but we need to be careful about $or for search which might not apply to stats.
      // So we'll just use userId and campaignId for stats.
      // NOTE: Mongoose aggregation pipeline doesn't auto-cast strings to ObjectIds.
      // We will skip campaign-specific stats in the aggregation for now to avoid complexity 
      // or just use the general stats.
    }

    const stats = await CampaignEmailHistory.aggregate([
      { $match: campaignId ? { userId, campaignId: new (await import('mongoose')).default.Types.ObjectId(campaignId) } : { userId } },
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
