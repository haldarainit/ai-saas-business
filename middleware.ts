import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";

    // Define allowed domains (including localhost for development)
    const allowedDomains = ["localhost:3000", "your-production-domain.com"];

    // Initialize response
    let response = NextResponse.next();

    // Check if the current hostname is a subdomain
    const isSubdomain = !allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));

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
