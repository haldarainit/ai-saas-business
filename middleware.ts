import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function applySecurityHeaders(response: NextResponse, request: NextRequest) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()"
    );

    if (request.nextUrl.protocol === "https:") {
        response.headers.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains"
        );
    }
}

export function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";

    // Initialize response
    let response = NextResponse.next();

    // Rewrite logic
    let currentHost = hostname;
    if (hostname.includes(":")) {
        currentHost = hostname.split(":")[0];
    }

    const mainDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";

    if (currentHost !== mainDomain && currentHost.endsWith(`.${mainDomain}`)) {
        const subdomain = currentHost.replace(`.${mainDomain}`, "");
        // Rewrite to the preview page
        response = NextResponse.rewrite(new URL(`/preview/${subdomain}${url.pathname}`, req.url));
    }

    // Add headers required for WebContainer (SharedArrayBuffer)
    // ONLY for the builder route to avoid breaking other parts like Google Auth or Images
    if (url.pathname.startsWith('/builder')) {
        response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
        response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
        response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    }

    applySecurityHeaders(response, req);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
