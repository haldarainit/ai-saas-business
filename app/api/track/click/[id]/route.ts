import dbConnect from "@/lib/mongodb";
import EmailTracking from "@/lib/models/EmailTracking";
import { broadcast } from "@/lib/realtime/sse";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

interface UserAgentInfo {
    type: string;
    browser: string;
    os: string;
}

function parseUserAgent(ua: string): UserAgentInfo {
    if (!ua) return { type: "unknown", browser: "unknown", os: "unknown" };
    const s = ua.toLowerCase();
    const type = /mobile|android|iphone|ipad/.test(s)
        ? "mobile"
        : /tablet/.test(s)
            ? "tablet"
            : "desktop";
    const browser = /chrome\//.test(s)
        ? "chrome"
        : /safari\//.test(s) && !/chrome\//.test(s)
            ? "safari"
            : /firefox\//.test(s)
                ? "firefox"
                : /edg\//.test(s)
                    ? "edge"
                    : "unknown";
    const os = /windows/.test(s)
        ? "windows"
        : /mac os x/.test(s)
            ? "macos"
            : /android/.test(s)
                ? "android"
                : /linux/.test(s)
                    ? "linux"
                    : /iphone|ipad|ios/.test(s)
                        ? "ios"
                        : "unknown";
    return { type, browser, os };
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get("url");
    if (!redirectUrl) {
        return new Response("Missing url", { status: 400 });
    }

    try {
        await dbConnect();
        const { id } = await props.params;
        const trackingId = id;
        console.log(
            "🔗 [TRACKING] Click tracked for ID:",
            trackingId,
            "URL:",
            redirectUrl
        );

        const headers = request.headers;
        const ipAddress =
            headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            headers.get("x-real-ip") ||
            "unknown";
        const userAgent = headers.get("user-agent") || "";
        const device = parseUserAgent(userAgent);

        let tracked: any = null;
        try {
            tracked = await EmailTracking.findById(trackingId);
        } catch (_e) {
            console.log(
                "⚠️ [TRACKING] Invalid ObjectId, trying emailId:",
                trackingId
            );
        }
        if (!tracked) {
            tracked = await EmailTracking.findOne({ emailId: trackingId });
        }

        if (tracked) {
            console.log("✅ [TRACKING] Recording click for:", tracked.recipientEmail);
            console.log("🔗 [TRACKING] Destination URL:", redirectUrl);
            await tracked.recordClick({
                url: redirectUrl,
                ipAddress,
                userAgent,
                device,
            });
            console.log(
                "✅ [TRACKING] Click recorded! Total clicks:",
                tracked.totalClicks
            );

            // Fire webhook to notify external systems
            try {
                const base =
                    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
                const webhookResponse = await fetch(
                    `${base}/api/webhook/email-clicked`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            trackingId: tracked._id.toString(),
                            recipient: tracked.recipientEmail,
                            subject: tracked.emailSubject,
                            url: redirectUrl,
                            clickedAt: new Date().toISOString(),
                            clickCount: tracked.totalClicks || 1,
                            ipAddress,
                            device,
                        }),
                    }
                );
                console.log(
                    "📡 [WEBHOOK] Email click webhook sent:",
                    webhookResponse.ok ? "✅ Success" : "❌ Failed"
                );
            } catch (webhookError: any) {
                console.error(
                    "📡 [WEBHOOK] Failed to send webhook:",
                    webhookError.message
                );
            }

            // Notify SSE subscribers
            try {
                await broadcast((tracked._id || "").toString(), {
                    type: "click",
                    trackingId: tracked._id.toString(),
                    totalClicks: tracked.totalClicks,
                    lastClickedAt:
                        tracked.clicks?.[tracked.clicks.length - 1]?.timestamp ||
                        new Date(),
                    status: tracked.status,
                });
            } catch (_) { }
        } else {
            console.log("❌ [TRACKING] No tracking record found for ID:", trackingId);
        }
    } catch (_e) {
        console.error("❌ [TRACKING] Error:", _e);
        // ignore tracking errors; continue redirecting
    }

    console.log("🔄 [TRACKING] Redirecting to:", redirectUrl);
    return Response.redirect(redirectUrl, 302);
}
