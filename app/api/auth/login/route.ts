import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getUserBillingSummary } from "@/lib/billing/subscription";
import { isAdminEmail } from "@/lib/auth/admin";
import { enforceRateLimit, getClientIpAddress } from "@/lib/security/rate-limit";
import { enforceSystemAccess } from "@/lib/system/enforce";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimit = enforceRateLimit({
      key: `login:${ipAddress}`,
      windowMs: 10 * 60 * 1000,
      maxRequests: 30,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    await dbConnect();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      let shouldSave = false;

      if (!user.role) {
        user.role = "user";
        shouldSave = true;
      }

      if (!user.planId) {
        user.planId = "free";
        shouldSave = true;
      }

      if (!user.planStatus) {
        user.planStatus = "active";
        shouldSave = true;
      }

      if (!user.planBillingCycle) {
        user.planBillingCycle = "monthly";
        shouldSave = true;
      }

      if (!user.accountStatus) {
        user.accountStatus = "active";
        shouldSave = true;
      }

      if (typeof user.sessionVersion !== "number" || user.sessionVersion < 1) {
        user.sessionVersion = 1;
        shouldSave = true;
      }

      if (typeof user.rateLimitBonusCredits !== "number") {
        user.rateLimitBonusCredits = 0;
        shouldSave = true;
      }

      if (isAdminEmail(user.email) && user.role !== "admin") {
        user.role = "admin";
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.accountStatus === "suspended") {
      return NextResponse.json(
        {
          error:
            user.suspendedReason ||
            "Your account is suspended. Please contact support.",
        },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const systemAccess = await enforceSystemAccess({ user });
    if (!systemAccess.ok) {
      return systemAccess.response;
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Create JWT token
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
      { expiresIn: "7d" }
    );

    // Return user data and token
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      onboardingCompleted: user.onboardingCompleted || false,
      role: user.role,
      billing: await getUserBillingSummary(user),
    };

    const response = NextResponse.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
    const isAdminSession = user.role === "admin";

    // Set HTTP-only cookie with the token
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: isAdminSession ? "strict" : "lax",
      maxAge: isAdminSession ? 60 * 60 * 12 : 60 * 60 * 24 * 7,
      path: "/",
      // In production, set domain if needed
      ...(process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN && {
        domain: process.env.COOKIE_DOMAIN
      })
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
