import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb.ts";
import EmailTracking from "@/lib/models/EmailTracking";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const { campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const detailLevel = searchParams.get("detail") || "summary"; // summary or detailed

    // Validate campaign ID
    if (!campaignId || !mongoose.Types.ObjectId.isValid(campaignId)) {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get campaign statistics
    const stats = await EmailTracking.getCampaignStats(campaignId);

    if (detailLevel === "detailed") {
      // Get detailed tracking records
      const trackingRecords = await EmailTracking.find({
        campaignId: new mongoose.Types.ObjectId(campaignId),
      })
        .select("-opens -clicks") // Exclude large arrays for overview
        .sort({ sentAt: -1 })
        .lean();

      // Get engagement timeline (opens and clicks over time)
      const timeline = await EmailTracking.aggregate([
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        { $unwind: "$opens" },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$opens.timestamp",
              },
            },
            opens: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", opens: 1, _id: 0 } },
      ]);

      // Get top performing recipients
      const topRecipients = await EmailTracking.find({
        campaignId: new mongoose.Types.ObjectId(campaignId),
        totalOpens: { $gt: 0 },
      })
        .select(
          "recipientEmail totalOpens totalClicks firstOpenedAt lastOpenedAt"
        )
        .sort({ totalOpens: -1, totalClicks: -1 })
        .limit(10)
        .lean();

      // Get device breakdown
      const deviceStats = await EmailTracking.aggregate([
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        { $unwind: "$opens" },
        {
          $group: {
            _id: "$opens.device.type",
            count: { $sum: 1 },
          },
        },
      ]);

      // Get browser breakdown
      const browserStats = await EmailTracking.aggregate([
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        { $unwind: "$opens" },
        {
          $group: {
            _id: "$opens.device.browser",
            count: { $sum: 1 },
          },
        },
      ]);

      // Get most clicked links
      const clickedLinks = await EmailTracking.aggregate([
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        { $unwind: "$clicks" },
        {
          $group: {
            _id: "$clicks.url",
            clicks: { $sum: 1 },
            uniqueClickers: { $addToSet: "$recipientEmail" },
          },
        },
        {
          $project: {
            url: "$_id",
            clicks: 1,
            uniqueClickers: { $size: "$uniqueClickers" },
            _id: 0,
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]);

      return NextResponse.json({
        success: true,
        stats,
        details: {
          recipients: trackingRecords,
          timeline,
          topRecipients,
          deviceStats,
          browserStats,
          clickedLinks,
        },
      });
    }

    // Return summary stats only
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching tracking stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking statistics", details: error.message },
      { status: 500 }
    );
  }
}

// Get tracking details for a specific recipient
export async function POST(request, { params }) {
  try {
    const { campaignId } = await params;
    const { recipientEmail } = await request.json();

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const tracking = await EmailTracking.findOne({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      recipientEmail,
    }).lean();

    if (!tracking) {
      return NextResponse.json(
        { error: "Tracking record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tracking,
    });
  } catch (error) {
    console.error("Error fetching recipient tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipient tracking", details: error.message },
      { status: 500 }
    );
  }
}
