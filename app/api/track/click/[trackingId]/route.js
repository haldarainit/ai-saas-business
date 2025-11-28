import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/mongodb";
import EmailTracking from "../../../../../lib/models/EmailTracking";

export async function GET(request, { params }) {
  try {
    const { trackingId } = params;
    const { searchParams } = new URL(request.url);
    const originalUrl = searchParams.get("url");

    if (!originalUrl) {
      return NextResponse.redirect(
        new URL(
          "/",
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        )
      );
    }

    await dbConnect();

    // Find the tracking record
    const tracking = await EmailTracking.findById(trackingId);

    if (tracking) {
      // Get device info from user agent
      const userAgent = request.headers.get("user-agent") || "";
      const device = parseUserAgent(userAgent);

      // Record the click
      await tracking.recordClick({
        url: decodeURIComponent(originalUrl),
        ipAddress: getClientIp(request),
        userAgent: userAgent,
        device: device,
      });

      console.log(`✓ Link click tracked for email: ${tracking.recipientEmail}`);
    } else {
      console.warn(`⚠️ Tracking record not found: ${trackingId}`);
    }

    // Redirect to the original URL
    return NextResponse.redirect(decodeURIComponent(originalUrl));
  } catch (error) {
    console.error("Error tracking link click:", error);

    // Still redirect even if tracking fails
    const { searchParams } = new URL(request.url);
    const originalUrl = searchParams.get("url");

    if (originalUrl) {
      return NextResponse.redirect(decodeURIComponent(originalUrl));
    }

    return NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
    );
  }
}

// Helper function to parse user agent
function parseUserAgent(userAgent) {
  const ua = userAgent.toLowerCase();

  let deviceType = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = "tablet";
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      userAgent
    )
  ) {
    deviceType = "mobile";
  }

  let browser = "unknown";
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("edge")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  let os = "unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "MacOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return {
    type: deviceType,
    browser: browser,
    os: os,
  };
}

// Helper function to get client IP
function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (real) {
    return real;
  }

  return "unknown";
}
