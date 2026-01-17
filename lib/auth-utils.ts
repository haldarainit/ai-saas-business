import jwt, { JwtPayload } from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Interface for decoded JWT payload
interface DecodedToken extends JwtPayload {
    userId: string;
    email: string;
    name: string;
}

// Interface for user data
export interface AuthUser {
    id: string;
    email: string;
    name: string;
}

// Result type for auth extraction
export type AuthResult =
    | { success: true; user: AuthUser }
    | { success: false; error: string };

// Extended request type with user
export interface AuthenticatedRequest extends NextRequest {
    user?: AuthUser;
}

export function extractUserFromRequest(request: NextRequest): AuthResult {
    try {
        // Try to get token from Authorization header
        const authHeader = request.headers.get("authorization");
        let token: string | null = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else {
            // Try to get token from cookies
            const cookies = request.headers.get("cookie");
            if (cookies) {
                const tokenMatch = cookies.match(/auth-token=([^;]+)/);
                if (tokenMatch) {
                    token = tokenMatch[1];
                }
            }
        }

        if (!token) {
            return { success: false, error: "No authentication token found" };
        }

        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        return {
            success: true,
            user: {
                id: decoded.userId,
                email: decoded.email,
                name: decoded.name,
            },
        };
    } catch (error) {
        console.error("Token verification error:", error);
        return { success: false, error: "Invalid authentication token" };
    }
}

type RouteHandler = (
    request: AuthenticatedRequest,
    ...args: unknown[]
) => Promise<NextResponse>;

export function requireAuth(handler: RouteHandler): RouteHandler {
    return async (request: AuthenticatedRequest, ...args: unknown[]) => {
        const authResult = extractUserFromRequest(request);

        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: 401 }
            );
        }

        // Add user to request for handler to use
        request.user = authResult.user;
        return handler(request, ...args);
    };
}
