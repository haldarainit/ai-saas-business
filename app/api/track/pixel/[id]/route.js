import dbConnect from "../../../../../lib/mongodb";
import EmailTracking from "../../../../../lib/models/EmailTracking";
import { broadcast } from "../../../../../lib/realtime/sse";

export const runtime = "nodejs";

function parseUserAgent(ua) {
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

// Green checkmark image (100x100 PNG with "✓" symbol)
const pixel = Buffer.from(
  "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",
  "base64"
);

export async function GET(_req, { params }) {
  try {
    await dbConnect();
    const trackingId = params.id;
    console.log("📧 [TRACKING] Pixel loaded for ID:", trackingId);

    const headers = _req.headers;
    const ipAddress =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      "unknown";
    const userAgent = headers.get("user-agent") || "";
    const device = parseUserAgent(userAgent);

    // Find by _id first; if invalid, try emailId fallback
    let tracked = null;
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
      console.log("✅ [TRACKING] Recording open for:", tracked.recipientEmail);
      await tracked.recordOpen({ ipAddress, userAgent, device });
      console.log(
        "✅ [TRACKING] Open recorded! Total opens:",
        tracked.totalOpens
      );

      // Fire webhook (optional)
      try {
        const base =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        await fetch(`${base}/api/webhook/email-opened`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingId: tracked._id.toString(),
            recipient: tracked.recipientEmail,
            subject: tracked.emailSubject,
            openedAt: tracked.lastOpenedAt || new Date().toISOString(),
            openCount: tracked.totalOpens || 1,
          }),
        });
      } catch (_) {
        // no-op
      }

      // Notify SSE subscribers
      try {
        await broadcast((tracked._id || "").toString(), {
          type: "open",
          trackingId: tracked._id.toString(),
          totalOpens: tracked.totalOpens,
          firstOpenedAt: tracked.firstOpenedAt,
          lastOpenedAt: tracked.lastOpenedAt,
          status: tracked.status,
        });
      } catch (_) {
        // no-op
      }
    } else {
      console.log("❌ [TRACKING] No tracking record found for ID:", trackingId);
    }

    return new Response(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(pixel.length),
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (e) {
    return new Response(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(pixel.length),
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    });
  }
}
