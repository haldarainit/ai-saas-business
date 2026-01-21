import { NextRequest } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import EmailTracking from "../../../../lib/models/EmailTracking";

export const runtime = "nodejs";

// Type definitions
interface WebhookBody {
    trackingId?: string;
    recipient?: string;
    subject?: string;
    openedAt?: string;
    openCount?: number;
}

export async function POST(request: NextRequest): Promise<Response> {
    try {
        await dbConnect();
        const body: WebhookBody = await request.json();
        const { trackingId, recipient, subject, openedAt, openCount } = body || {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let doc: any = null;
        try {
            doc = await EmailTracking.findById(trackingId);
        } catch (_) {
            // Invalid ObjectId, will try emailId fallback
        }
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
        console.error("❌ [WEBHOOK] Error processing email-opened webhook:", e);
        return Response.json(
            { received: false, error: "Internal error" },
            { status: 500 }
        );
    }
}
