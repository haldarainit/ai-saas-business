import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { isAdminEmail } from "@/lib/auth/admin";
import { getUserBillingSummary } from "@/lib/billing/subscription";
import { enforceRateLimit, getClientIpAddress } from "@/lib/security/rate-limit";
import { enforceSystemAccess } from "@/lib/system/enforce";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimit = enforceRateLimit({
      key: `signup:${ipAddress}`,
      windowMs: 10 * 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const systemAccess = await enforceSystemAccess({ capability: "signup" });
    if (!systemAccess.ok) {
      return systemAccess.response;
    }

    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name?.trim() || null,
      role: isAdminEmail(email) ? "admin" : "user",
      planBillingCycle: "monthly",
      lastLoginAt: new Date(),
    });

    const savedUser = await user.save();

    // Create JWT token
    const token = jwt.sign(
      {
        userId: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        planId: savedUser.planId,
        sv: savedUser.sessionVersion ?? 1,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data and token
    const userResponse = {
      id: savedUser._id,
      email: savedUser.email,
      name: savedUser.name,
      createdAt: savedUser.createdAt,
      onboardingCompleted: savedUser.onboardingCompleted || false,
      role: savedUser.role,
      billing: await getUserBillingSummary(savedUser),
    };

    const response = NextResponse.json({
      message: "Account created successfully",
      user: userResponse,
      token,
    });
    const isAdminSession = savedUser.role === "admin";

    // Set HTTP-only cookie with the token
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: isAdminSession ? "strict" : "lax",
      maxAge: isAdminSession ? 60 * 60 * 12 : 60 * 60 * 24 * 7,
      path: "/",
      ...(process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN && {
        domain: process.env.COOKIE_DOMAIN,
      }),
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
