import dbConnect from "../../../../lib/mongodb";
import EmailTracking from "../../../../lib/models/EmailTracking";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function POST(request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { success: false, error: "Not available" },
      { status: 403 }
    );
  }
  try {
    await dbConnect();
    const body = await request.json();
    const recipientEmail = body.recipientEmail || "test@example.com";
    const subject = body.subject || "Debug Email";
    const userId = body.userId || "dev-user-default";
    const campaignId = body.campaignId || new mongoose.Types.ObjectId();

    const doc = await EmailTracking.create({
      campaignId,
      emailId: Math.random().toString(36).slice(2),
      recipientEmail,
      userId,
      emailSubject: subject,
      sentAt: new Date(),
      status: "sent",
    });

    return Response.json({
      success: true,
      trackingId: doc._id.toString(),
      doc,
    });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
