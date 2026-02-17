import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import type { Session } from "next-auth";
import { getAuthJwtSecret } from "@/lib/auth/jwt-secret";

interface DecodedTokenPayload {
  userId: string;
  email?: string;
  name?: string;
  sv?: number;
}

type ExtendedSession = Session & {
  userId?: string;
  sessionVersion?: number;
  user?: Session["user"] & {
    id?: string;
  };
};

async function resolveAndValidateUser(identity: {
    userId?: string | null;
    email?: string | null;
    name?: string | null;
    sessionVersion?: number | null;
}): Promise<{ userId: string; email: string | null; name: string | null } | null> {
    await dbConnect();

    let user = null;

    if (identity.userId && mongoose.Types.ObjectId.isValid(identity.userId)) {
        user = await User.findById(identity.userId).select("email name sessionVersion accountStatus");
    }

    if (!user && identity.email) {
        user = await User.findOne({ email: identity.email.toLowerCase() }).select("email name sessionVersion accountStatus");
    }

    if (!user) {
        return null;
    }

    if (user.accountStatus === "suspended") {
        return null;
    }

    const tokenSessionVersion = identity.sessionVersion ?? 1;
    const userSessionVersion = user.sessionVersion ?? 1;

    if (tokenSessionVersion !== userSessionVersion) {
        return null;
    }

    return {
        userId: String(user._id),
        email: user.email || null,
        name: user.name || identity.name || null,
    };
}

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
        const session = (await getServerSession(authOptions)) as ExtendedSession | null;
        if (session) {
            const userId = session.userId || session.user?.id || session.user?.email;
            const email = session.user?.email || null;
            const name = session.user?.name || null;
            const sessionVersion = session.sessionVersion ?? 1;

            if (userId) {
                const validated = await resolveAndValidateUser({
                    userId,
                    email,
                    name,
                    sessionVersion,
                });

                if (validated) {
                    return validated;
                }
            }
        }
    } catch (error) {
        console.error("Error getting NextAuth session:", error);
    }

    const jwtSecret = getAuthJwtSecret();
    if (jwtSecret) {
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
                    const decoded = jwt.verify(authToken.value, jwtSecret) as DecodedTokenPayload;

                    if (decoded && decoded.userId) {
                        const validated = await resolveAndValidateUser({
                            userId: decoded.userId,
                            email: decoded.email || null,
                            name: decoded.name || null,
                            sessionVersion: decoded.sv ?? 1,
                        });

                        if (validated) {
                            return validated;
                        }
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
                        const decoded = jwt.verify(tokenMatch[1], jwtSecret) as DecodedTokenPayload;

                        if (decoded && decoded.userId) {
                            const validated = await resolveAndValidateUser({
                                userId: decoded.userId,
                                email: decoded.email || null,
                                name: decoded.name || null,
                                sessionVersion: decoded.sv ?? 1,
                            });

                            if (validated) {
                                return validated;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error verifying JWT from request:", error);
            }
        }
    }

    return { userId: null, email: null, name: null };
}
