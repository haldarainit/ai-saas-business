import dbConnect from "../../../lib/mongodb.js";
import Campaign from "../../../lib/models/Campaign.js";
import CampaignEmailHistory from "../../../lib/models/CampaignEmailHistory.js";
import { extractUserFromRequest } from "../../../lib/auth-utils.js";

export async function POST(request) {
  try {
    await dbConnect();

    // Extract user information from authentication token
    let userId = null;
    const authResult = extractUserFromRequest(request);
    if (authResult.success) {
      userId = authResult.user.id;
    } else {
      userId =
        "dev-user-" +
        (process.env.NODE_ENV === "development" ? "default" : "anonymous");
    }

    const { action } = await request.json();

    if (action === "cleanup") {
      console.log("🧹 Starting campaign cleanup for user:", userId);

      // 1. Find all campaigns for this user
      const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 });
      console.log(`Found ${campaigns.length} campaigns`);

      const results = {
        deleted: 0,
        completed: 0,
        fixed: 0,
        kept: 0,
      };

      for (const campaign of campaigns) {
        // Count actual email logs for this campaign
        const actualSentCount = await CampaignEmailHistory.countDocuments({
          campaignId: campaign._id,
          status: "sent",
        });

        const actualTotalLogs = await CampaignEmailHistory.countDocuments({
          campaignId: campaign._id,
        });

        console.log(`Campaign ${campaign._id}:`, {
          status: campaign.status,
          sentCount: campaign.sentCount,
          actualSentCount,
          totalEmails: campaign.totalEmails,
          actualTotalLogs,
          currentIndex: campaign.currentIndex,
        });

        // Delete campaigns with 0 sent and 0 logs (empty/duplicate campaigns)
        if (actualSentCount === 0 && actualTotalLogs === 0 && campaign.sentCount === 0) {
          console.log(`🗑️ Deleting empty campaign: ${campaign._id}`);
          await Campaign.deleteOne({ _id: campaign._id });
          results.deleted++;
          continue;
        }

        // Fix campaigns where sentCount doesn't match actual sent logs
        if (campaign.sentCount !== actualSentCount) {
          console.log(`🔧 Fixing sentCount for campaign ${campaign._id}: ${campaign.sentCount} -> ${actualSentCount}`);
          await Campaign.updateOne(
            { _id: campaign._id },
            { 
              $set: { 
                sentCount: actualSentCount,
                currentIndex: actualSentCount,
              } 
            }
          );
          results.fixed++;
        }

        // Mark campaigns as completed if all emails were sent but status is still active/paused
        if (
          (campaign.status === "active" || campaign.status === "paused") &&
          actualSentCount > 0 &&
          actualSentCount >= campaign.totalEmails
        ) {
          console.log(`✅ Marking campaign ${campaign._id} as completed`);
          await Campaign.updateOne(
            { _id: campaign._id },
            {
              $set: {
                status: "completed",
                completedAt: new Date(),
                sentCount: actualSentCount,
                currentIndex: actualSentCount,
              },
            }
          );
          results.completed++;
          continue;
        }

        // Fix totalEmails if it doesn't match recipients count
        const recipientsCount = campaign.recipients?.length || 0;
        if (campaign.totalEmails !== recipientsCount && recipientsCount > 0) {
          console.log(`🔧 Fixing totalEmails for campaign ${campaign._id}: ${campaign.totalEmails} -> ${recipientsCount}`);
          await Campaign.updateOne(
            { _id: campaign._id },
            { $set: { totalEmails: recipientsCount } }
          );
          results.fixed++;
        }

        results.kept++;
      }

      // 2. Clean up orphaned email logs (logs without a valid campaign)
      const allCampaignIds = campaigns.map((c) => c._id);
      const orphanedLogs = await CampaignEmailHistory.deleteMany({
        userId,
        campaignId: { $nin: allCampaignIds },
      });

      console.log(`🧹 Deleted ${orphanedLogs.deletedCount} orphaned email logs`);

      return Response.json({
        success: true,
        message: "Cleanup completed",
        results: {
          ...results,
          orphanedLogsDeleted: orphanedLogs.deletedCount,
        },
      });
    }

    if (action === "fix-active-completed") {
      // Find campaigns that are "active" but have all emails sent
      const activeCampaigns = await Campaign.find({
        userId,
        status: "active",
      });

      let fixed = 0;
      for (const campaign of activeCampaigns) {
        if (campaign.sentCount >= campaign.totalEmails && campaign.totalEmails > 0) {
          await Campaign.updateOne(
            { _id: campaign._id },
            {
              $set: {
                status: "completed",
                completedAt: new Date(),
              },
            }
          );
          fixed++;
          console.log(`✅ Fixed active campaign ${campaign._id} -> completed`);
        }
      }

      return Response.json({
        success: true,
        message: `Fixed ${fixed} campaigns`,
        fixed,
      });
    }

    return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Cleanup API error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();

    // Extract user information
    let userId = null;
    const authResult = extractUserFromRequest(request);
    if (authResult.success) {
      userId = authResult.user.id;
    } else {
      userId =
        "dev-user-" +
        (process.env.NODE_ENV === "development" ? "default" : "anonymous");
    }

    // Get campaign health report
    const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 });

    const report = [];
    for (const campaign of campaigns) {
      const actualSentCount = await CampaignEmailHistory.countDocuments({
        campaignId: campaign._id,
        status: "sent",
      });

      const actualPendingCount = await CampaignEmailHistory.countDocuments({
        campaignId: campaign._id,
        status: "pending",
      });

      const issues = [];
      if (campaign.sentCount !== actualSentCount) {
        issues.push(`sentCount mismatch: db=${campaign.sentCount}, actual=${actualSentCount}`);
      }
      if (campaign.status === "active" && actualSentCount >= campaign.totalEmails && campaign.totalEmails > 0) {
        issues.push("Should be completed but status is active");
      }
      if (actualSentCount === 0 && actualPendingCount === 0 && campaign.sentCount === 0) {
        issues.push("Empty campaign - no logs");
      }

      report.push({
        id: campaign._id,
        subject: campaign.subject,
        status: campaign.status,
        sentCount: campaign.sentCount,
        actualSentCount,
        actualPendingCount,
        totalEmails: campaign.totalEmails,
        recipientsCount: campaign.recipients?.length || 0,
        createdAt: campaign.createdAt,
        issues: issues.length > 0 ? issues : ["OK"],
      });
    }

    return Response.json({
      success: true,
      data: {
        totalCampaigns: campaigns.length,
        campaignsWithIssues: report.filter((r) => r.issues[0] !== "OK").length,
        report,
      },
    });
  } catch (error) {
    console.error("Cleanup GET error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
