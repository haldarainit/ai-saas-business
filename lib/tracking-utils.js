import crypto from "crypto";

/**
 * Generate a unique tracking ID for an email
 */
export function generateTrackingId(campaignId, recipientEmail) {
  const data = `${campaignId}-${recipientEmail}-${Date.now()}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Generate tracking pixel URL
 */
export function generateTrackingPixelUrl(trackingId, baseUrl) {
  const url =
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${url}/api/track/pixel/${trackingId}`;
}

/**
 * Generate tracked link URL
 */
export function generateTrackedLinkUrl(trackingId, originalUrl, baseUrl) {
  const url =
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const encodedUrl = encodeURIComponent(originalUrl);
  return `${url}/api/track/click/${trackingId}?url=${encodedUrl}`;
}

/**
 * Parse user agent string to extract device information
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      type: "unknown",
      browser: "unknown",
      os: "unknown",
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect device type
  let type = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    type = "tablet";
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      userAgent
    )
  ) {
    type = "mobile";
  }

  // Detect browser
  let browser = "unknown";
  if (ua.includes("edg/")) {
    browser = "Edge";
  } else if (ua.includes("chrome")) {
    browser = "Chrome";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("msie") || ua.includes("trident/")) {
    browser = "Internet Explorer";
  } else if (ua.includes("opera") || ua.includes("opr/")) {
    browser = "Opera";
  }

  // Detect OS
  let os = "unknown";
  if (ua.includes("windows nt 10.0")) {
    os = "Windows 10";
  } else if (ua.includes("windows nt 6.3")) {
    os = "Windows 8.1";
  } else if (ua.includes("windows nt 6.2")) {
    os = "Windows 8";
  } else if (ua.includes("windows nt 6.1")) {
    os = "Windows 7";
  } else if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac os x")) {
    os = "macOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
  }

  return { type, browser, os };
}

/**
 * Extract IP address from request
 */
export function getClientIp(request) {
  // For Next.js App Router, request is a NextRequest object
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") || // Cloudflare
    request.ip ||
    "unknown"
  );
}

/**
 * Get location data from IP (placeholder - integrate with IP geolocation service)
 */
export async function getLocationFromIp(ip) {
  // In production, integrate with services like:
  // - ipapi.co
  // - ip-api.com
  // - MaxMind GeoIP2
  // - ipinfo.io

  // For now, return a placeholder
  // You can add actual API calls here
  return {
    country: "Unknown",
    region: "Unknown",
    city: "Unknown",
  };
}

/**
 * Wrap all links in HTML content with tracking URLs
 */
export function wrapLinksWithTracking(htmlContent, trackingId, baseUrl) {
  if (!htmlContent) return htmlContent;

  // Regular expression to match href attributes in anchor tags
  const linkRegex = /(<a[^>]*href=["'])([^"']+)(["'][^>]*>)/gi;

  return htmlContent.replace(linkRegex, (match, prefix, url, suffix) => {
    // Skip if it's already a tracking link or a mailto/tel link
    if (
      url.includes("/api/track/click/") ||
      url.startsWith("mailto:") ||
      url.startsWith("tel:") ||
      url.startsWith("#")
    ) {
      return match;
    }

    // Generate tracked URL
    const trackedUrl = generateTrackedLinkUrl(trackingId, url, baseUrl);
    return `${prefix}${trackedUrl}${suffix}`;
  });
}

/**
 * Embed tracking pixel in HTML content
 */
export function embedTrackingPixel(htmlContent, trackingId, baseUrl) {
  if (!htmlContent) return htmlContent;

  const pixelUrl = generateTrackingPixelUrl(trackingId, baseUrl);
  const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;

  // Try to insert before closing body tag
  if (htmlContent.includes("</body>")) {
    return htmlContent.replace("</body>", `${trackingPixel}</body>`);
  }

  // Otherwise, append to the end
  return htmlContent + trackingPixel;
}

/**
 * Generate transparent 1x1 pixel image
 */
export function generateTransparentPixel() {
  // Base64 encoded transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  return pixel;
}

/**
 * Validate tracking ID format
 */
export function isValidTrackingId(trackingId) {
  // Check if it's a valid SHA256 hash (64 hex characters)
  return /^[a-f0-9]{64}$/i.test(trackingId);
}

/**
 * Create tracking data object from request
 */
export async function createTrackingDataFromRequest(request) {
  const userAgent = request.headers.get("user-agent") || "";
  const ip = getClientIp(request);
  const device = parseUserAgent(userAgent);
  const location = await getLocationFromIp(ip);

  return {
    ipAddress: ip,
    userAgent,
    device,
    location,
  };
}
