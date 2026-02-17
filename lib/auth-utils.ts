import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getAuthJwtSecret } from "@/lib/auth/jwt-secret";

interface DecodedToken extends JwtPayload {
  userId: string;
  email?: string;
  name?: string;
  sv?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: "user" | "admin";
}

export type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string };

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookieToken = request.cookies.get("auth-token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export async function extractUserFromRequest(
  request: NextRequest
): Promise<AuthResult> {
  try {
    const jwtSecret = getAuthJwtSecret();
    if (!jwtSecret) {
      return { success: false, error: "Server authentication is not configured" };
    }

    const token = getTokenFromRequest(request);

    if (!token) {
      return { success: false, error: "No authentication token found" };
    }

    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    if (!decoded?.userId) {
      return { success: false, error: "Invalid authentication token" };
    }

    await dbConnect();

    let user = null;
    if (mongoose.Types.ObjectId.isValid(decoded.userId)) {
      user = await User.findById(decoded.userId).select(
        "email name role sessionVersion accountStatus"
      );
    }

    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase() }).select(
        "email name role sessionVersion accountStatus"
      );
    }

    if (!user) {
      return { success: false, error: "User account not found" };
    }

    if (user.accountStatus === "suspended") {
      return { success: false, error: "Account is suspended" };
    }

    const tokenSessionVersion = decoded.sv ?? 1;
    const userSessionVersion = user.sessionVersion ?? 1;
    if (tokenSessionVersion !== userSessionVersion) {
      return { success: false, error: "Session expired. Please sign in again." };
    }

    return {
      success: true,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name || decoded.name || "",
        role: user.role,
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
    const authResult = await extractUserFromRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    request.user = authResult.user;
    return handler(request, ...args);
  };
}
