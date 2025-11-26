import dbConnect from "../../../../lib/mongodb";
import EmailTracking from "../../../../lib/models/EmailTracking";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { trackingId, recipient, subject, openedAt, openCount } = body || {};

    let doc = null;
    try {
      doc = await EmailTracking.findById(trackingId);
    } catch (_) {}
    if (!doc && trackingId) {
      doc = await EmailTracking.findOne({ emailId: trackingId });
    }
    if (doc) {
      // Ensure fields are synchronized if webhook was called externally
      if (recipient) doc.recipientEmail = recipient;
      if (subject && !doc.emailSubject) doc.emailSubject = subject;
      if (openedAt && !doc.firstOpenedAt)
        doc.firstOpenedAt = new Date(openedAt);
      if (openCount && (!doc.totalOpens || doc.totalOpens < openCount))
        doc.totalOpens = openCount;
      if (doc.status === "sent") doc.status = "opened";
      await doc.save();
    }

    return Response.json({ received: true });
  } catch (e) {
    return Response.json(
      { received: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
