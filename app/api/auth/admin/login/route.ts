import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getUserBillingSummary } from "@/lib/billing/subscription";
import { createAdminAuditLog } from "@/lib/admin/audit";
import { enforceRateLimit, getClientIpAddress } from "@/lib/security/rate-limit";
import { enforceSystemAccess } from "@/lib/system/enforce";
import { ensureBootstrapAdminAccount } from "@/lib/auth/admin-bootstrap";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function invalidAdminCredentialsResponse() {
  return NextResponse.json(
    { error: "Invalid admin credentials" },
    { status: 401 }
  );
}

function clearNextAuthCookies(response: NextResponse) {
  const cookieBase = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
    ...(process.env.NODE_ENV === "production" &&
      process.env.COOKIE_DOMAIN && {
        domain: process.env.COOKIE_DOMAIN,
      }),
  };

  const nextAuthCookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
  ];

  for (const cookieName of nextAuthCookieNames) {
    response.cookies.set(cookieName, "", cookieBase);
  }
}

async function logAdminAuthEvent(params: {
  action: string;
  adminUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { action, adminUserId = "system", metadata } = params;

  try {
    await createAdminAuditLog({
      adminUserId,
      action,
      metadata,
    });
  } catch (error) {
    console.error("Failed to create admin auth audit log:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIpAddress(request);
    const body = (await request.json()) as { email?: string; password?: string };

    const normalizedEmail = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    const rateLimit = enforceRateLimit({
      key: `admin-login:${ipAddress}:${normalizedEmail || "unknown"}`,
      windowMs: 10 * 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many admin login attempts. Please try again later." },
        { status: 429 }
      );
    }

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await ensureBootstrapAdminAccount();
    await dbConnect();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      await logAdminAuthEvent({
        action: "admin.auth.login.failed",
        metadata: {
          email: normalizedEmail,
          reason: "user_missing_or_no_password",
          ipAddress,
        },
      });
      return invalidAdminCredentialsResponse();
    }

    if (user.role !== "admin") {
      await logAdminAuthEvent({
        action: "admin.auth.login.failed",
        adminUserId: String(user._id),
        metadata: {
          email: normalizedEmail,
          reason: "not_admin_role",
          ipAddress,
        },
      });
      return invalidAdminCredentialsResponse();
    }

    if (user.accountStatus === "suspended") {
      await logAdminAuthEvent({
        action: "admin.auth.login.failed",
        adminUserId: String(user._id),
        metadata: {
          email: normalizedEmail,
          reason: "suspended",
          ipAddress,
        },
      });
      return NextResponse.json(
        {
          error:
            user.suspendedReason ||
            "Your admin account is suspended. Please contact another admin.",
        },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logAdminAuthEvent({
        action: "admin.auth.login.failed",
        adminUserId: String(user._id),
        metadata: {
          email: normalizedEmail,
          reason: "invalid_password",
          ipAddress,
        },
      });
      return invalidAdminCredentialsResponse();
    }

    const systemAccess = await enforceSystemAccess({ user });
    if (!systemAccess.ok) {
      await logAdminAuthEvent({
        action: "admin.auth.login.failed",
        adminUserId: String(user._id),
        metadata: {
          email: normalizedEmail,
          reason: "system_access_blocked",
          ipAddress,
        },
      });
      return systemAccess.response;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        planId: user.planId,
        sv: user.sessionVersion ?? 1,
      },
      JWT_SECRET,
      { expiresIn: ADMIN_SESSION_MAX_AGE_SECONDS }
    );

    const response = NextResponse.json({
      message: "Admin login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        billing: await getUserBillingSummary(user),
      },
      token,
    });

    // Ensure stale NextAuth session cookies do not override the new admin JWT session.
    clearNextAuthCookies(response);

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
      path: "/",
      ...(process.env.NODE_ENV === "production" &&
        process.env.COOKIE_DOMAIN && {
          domain: process.env.COOKIE_DOMAIN,
        }),
    });

    await logAdminAuthEvent({
      action: "admin.auth.login.success",
      adminUserId: String(user._id),
      metadata: {
        email: user.email,
        ipAddress,
      },
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
