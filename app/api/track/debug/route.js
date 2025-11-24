import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb.ts";
import EmailTracking from "@/lib/models/EmailTracking";

export async function GET() {
  try {
    await connectDB();

    const count = await EmailTracking.countDocuments();
    const recent = await EmailTracking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      totalRecords: count,
      recentRecords: recent.map((r) => ({
        id: r._id,
        emailId: r.emailId,
        recipient: r.recipientEmail,
        status: r.status,
        opens: r.totalOpens,
        clicks: r.totalClicks,
        sentAt: r.sentAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
