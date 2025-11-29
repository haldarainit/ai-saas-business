import dbConnect from "../../../../lib/mongodb";
import EmailTracking from "../../../../lib/models/EmailTracking";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      trackingId,
      recipient,
      subject,
      url,
      clickedAt,
      clickCount,
      ipAddress,
      device,
    } = body || {};

    console.log("📬 [WEBHOOK] Received email click notification:", {
      trackingId,
      recipient,
      url,
      clickCount,
      ipAddress,
      device,
    });

    let doc = null;
    try {
      doc = await EmailTracking.findById(trackingId);
    } catch (_) {}
    if (!doc && trackingId) {
      doc = await EmailTracking.findOne({ emailId: trackingId });
    }
    if (doc) {
      if (recipient) doc.recipientEmail = recipient;
      if (subject && !doc.emailSubject) doc.emailSubject = subject;
      if (clickCount && (!doc.totalClicks || doc.totalClicks < clickCount))
        doc.totalClicks = clickCount;
      doc.status = "clicked";
      await doc.save();
      console.log("✅ [WEBHOOK] Tracking document updated successfully");
    } else {
      console.log("⚠️ [WEBHOOK] No tracking document found for:", trackingId);
    }

    return Response.json({
      received: true,
      message: "Click tracked successfully",
    });
  } catch (e) {
    console.error("❌ [WEBHOOK] Error processing webhook:", e);
    return Response.json(
      { received: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
