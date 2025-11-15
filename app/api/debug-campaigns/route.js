import { createCampaignScheduler } from "../../../lib/email/CampaignScheduler";
import { extractUserFromRequest } from "../../../lib/auth-utils";
import Campaign from "../../../lib/models/Campaign";
import EmailLog from "../../../lib/models/EmailLog";
import dbConnect from "../../../lib/mongodb";

export async function GET(request) {
  try {
    // Extract user information from authentication token (optional for development)
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
    await dbConnect();

    // Get all campaigns for this user
    const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 });

    // Get all email logs for this user
    const emailLogs = await EmailLog.find({ userId })
      .sort({ sentAt: -1 })
      .limit(10);

    // Get statistics
    const totalCampaigns = await Campaign.countDocuments({ userId });
    const totalEmailsSent = await EmailLog.countDocuments({
      userId,
      status: "sent",
    });
    const activeCampaigns = await Campaign.countDocuments({
      userId,
      status: "active",
    });

    return Response.json({
      success: true,
      data: {
        userId,
        statistics: {
          totalCampaigns,
          totalEmailsSent,
          activeCampaigns,
        },
        campaigns: campaigns.map((campaign) => ({
          _id: campaign._id,
          subject: campaign.subject,
          status: campaign.status,
          totalEmails: campaign.totalEmails,
          sentCount: campaign.sentCount,
          recipients: campaign.recipients
            ? campaign.recipients.slice(0, 3)
            : [], // First 3 recipients
          hasCsvData: !!campaign.csvData,
          csvDataSize: campaign.csvData?.data?.length || 0,
          enabledColumns: campaign.enabledColumns || [],
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        })),
        recentEmailLogs: emailLogs.map((log) => ({
          _id: log._id,
          recipientEmail: log.recipientEmail,
          subject: log.subject,
          status: log.status,
          sentAt: log.sentAt,
        })),
      },
    });
  } catch (error) {
    console.error("Debug API error:", error);
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

export async function POST(request) {
  try {
    // Extract user information from authentication token (optional for development)
    let userId = null;
    const authResult = extractUserFromRequest(request);
    if (authResult.success) {
      userId = authResult.user.id;
    } else {
      // For development: use a default user ID when no auth token
      userId =
        "dev-user-" +
        (process.env.NODE_ENV === "development" ? "default" : "anonymous");
    }

    const { action, campaignId } = await request.json();
    await dbConnect();

    if (action === "getCampaignDetails") {
      const campaign = await Campaign.findOne({ _id: campaignId, userId });

      if (!campaign) {
        return Response.json(
          { success: false, error: "Campaign not found" },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        data: {
          campaign: {
            _id: campaign._id,
            subject: campaign.subject,
            template: campaign.template,
            status: campaign.status,
            totalEmails: campaign.totalEmails,
            sentCount: campaign.sentCount,
            recipients: campaign.recipients || [],
            csvData: campaign.csvData || null,
            enabledColumns: campaign.enabledColumns || [],
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
          },
        },
      });
    }

    return Response.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Debug API POST error:", error);
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
