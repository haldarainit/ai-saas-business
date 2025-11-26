import dbConnect from "../../../lib/mongodb";
import EmailTracking from "../../../lib/models/EmailTracking";
import { extractUserFromRequest } from "../../../lib/auth-utils";

export async function GET(request) {
  try {
    await dbConnect();

    let userId = null;
    const auth = extractUserFromRequest(request);
    if (auth.success) {
      userId = auth.user.id;
    } else {
      userId =
        "dev-user-" +
        (process.env.NODE_ENV === "development" ? "default" : "anonymous");
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    const query = { userId };
    if (campaignId) query.campaignId = campaignId;

    const [totals, recent] = await Promise.all([
      EmailTracking.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalSent: { $sum: 1 },
            totalOpened: {
              $sum: { $cond: [{ $gt: ["$totalOpens", 0] }, 1, 0] },
            },
            totalClicked: {
              $sum: { $cond: [{ $gt: ["$totalClicks", 0] }, 1, 0] },
            },
            totalOpenEvents: { $sum: "$totalOpens" },
            totalClickEvents: { $sum: "$totalClicks" },
          },
        },
      ]),
      EmailTracking.find(query).sort({ sentAt: -1 }).limit(100).lean(),
    ]);

    const t = totals[0] || {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalOpenEvents: 0,
      totalClickEvents: 0,
    };

    return Response.json({
      success: true,
      totals: {
        totalSent: t.totalSent || 0,
        totalOpened: t.totalOpened || 0,
        totalClicked: t.totalClicked || 0,
        openRate: t.totalSent
          ? Number(((t.totalOpened / t.totalSent) * 100).toFixed(2))
          : 0,
        clickRate: t.totalSent
          ? Number(((t.totalClicked / t.totalSent) * 100).toFixed(2))
          : 0,
        totalOpenEvents: t.totalOpenEvents || 0,
        totalClickEvents: t.totalClickEvents || 0,
      },
      recent,
    });
  } catch (error) {
    console.error("email-analytics error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
