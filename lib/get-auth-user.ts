import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "your-secret-key";

/**
 * Get the authenticated user ID from either:
 * 1. NextAuth session (Google OAuth)
 * 2. Custom JWT token from email/password login (auth-token cookie)
 * 
 * Returns: { userId: string | null, email: string | null }
 */
export async function getAuthenticatedUser(request?: Request): Promise<{ userId: string | null; email: string | null; name: string | null }> {
    // First, try NextAuth session (for Google OAuth)
    try {
        const session = await getServerSession(authOptions);
        if (session) {
            // @ts-ignore - userId comes from auth-options callbacks
            const userId = session.userId || session.user?.email;
            // @ts-ignore
            const email = session.user?.email || null;
            // @ts-ignore
            const name = session.user?.name || null;

            if (userId) {
                return { userId, email, name };
            }
        }
    } catch (error) {
        console.error("Error getting NextAuth session:", error);
    }

    // Second, try custom JWT token from auth-token cookie (email/password login)
    try {
        let cookieStore;
        try {
            cookieStore = await cookies();
        } catch (cookieError) {
            // cookies() can fail in certain edge cases in Next.js 15
            console.warn("Could not access cookies from next/headers:", cookieError);
            cookieStore = null;
        }

        if (cookieStore) {
            const authToken = cookieStore.get("auth-token");

            if (authToken?.value) {
                const decoded = jwt.verify(authToken.value, JWT_SECRET) as {
                    userId: string;
                    email: string;
                    name: string;
                };

                if (decoded && decoded.userId) {
                    return {
                        userId: decoded.userId,
                        email: decoded.email || null,
                        name: decoded.name || null
                    };
                }
            }
        }
    } catch (error) {
        console.error("Error verifying JWT token:", error);
    }

    // Also check request cookies if request is provided
    if (request) {
        try {
            const cookieHeader = request.headers.get("cookie");
            if (cookieHeader) {
                const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
                if (tokenMatch && tokenMatch[1]) {
                    const decoded = jwt.verify(tokenMatch[1], JWT_SECRET) as {
                        userId: string;
                        email: string;
                        name: string;
                    };

                    if (decoded && decoded.userId) {
                        return {
                            userId: decoded.userId,
                            email: decoded.email || null,
                            name: decoded.name || null
                        };
                    }
                }
            }
        } catch (error) {
            console.error("Error verifying JWT from request:", error);
        }
    }

    return { userId: null, email: null, name: null };
}
