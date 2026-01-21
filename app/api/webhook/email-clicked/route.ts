import { NextRequest } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import EmailTracking from "../../../../lib/models/EmailTracking";

export const runtime = "nodejs";

// Type definitions
interface DeviceInfo {
    type: string;
    browser: string;
    os: string;
}

interface WebhookBody {
    trackingId?: string;
    recipient?: string;
    subject?: string;
    url?: string;
    clickedAt?: string;
    clickCount?: number;
    ipAddress?: string;
    device?: DeviceInfo;
}

export async function POST(request: NextRequest): Promise<Response> {
    try {
        await dbConnect();
        const body: WebhookBody = await request.json();
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
