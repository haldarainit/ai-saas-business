import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";

    // Define allowed domains (including localhost for development)
    const allowedDomains = ["localhost:3000", "your-production-domain.com"];

    // Check if the current hostname is a subdomain
    const isSubdomain = !allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));

    // If it's a subdomain, rewrite the path
    // We need to extract the subdomain part. 
    // For localhost:3000, sub.localhost:3000 -> sub
    // For domain.com, sub.domain.com -> sub

    let currentHost = hostname;
    if (hostname.includes(":")) {
        currentHost = hostname.split(":")[0];
    }

    // Simple check: if host is not the main domain, treat as subdomain
    // Adjust this logic based on your actual domain structure
    const mainDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";

    if (currentHost !== mainDomain && currentHost.endsWith(`.${mainDomain}`)) {
        const subdomain = currentHost.replace(`.${mainDomain}`, "");

        // Rewrite to the preview page
        return NextResponse.rewrite(new URL(`/preview/${subdomain}${url.pathname}`, req.url));
    }

    return NextResponse.next();
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
