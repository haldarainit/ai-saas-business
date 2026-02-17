import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { isAdminEmail } from "@/lib/auth/admin";
import { getUserBillingSummary } from "@/lib/billing/subscription";
import { enforceRateLimit, getClientIpAddress } from "@/lib/security/rate-limit";
import { enforceSystemAccess } from "@/lib/system/enforce";
import { getRequiredAuthJwtSecret } from "@/lib/auth/jwt-secret";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export async function POST(req: NextRequest) {
  try {
    const jwtSecret = getRequiredAuthJwtSecret();
    const ipAddress = getClientIpAddress(req);
    const rateLimit = enforceRateLimit({
      key: `google-verify:${ipAddress}`,
      windowMs: 10 * 60 * 1000,
      maxRequests: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many authentication attempts. Please try again later." },
        { status: 429 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const tokenId = authHeader.slice(7);
    const body = await req.json();

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid audience" },
        { status: 401 }
      );
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return NextResponse.json(
        { error: "Email not found in token" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Connect to database
    await connectDB();

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create new user
      user = await User.create({
        email: normalizedEmail,
        name: name || body.name,
        googleId,
        image: picture || body.image,
        authProvider: "google",
        role: isAdminEmail(normalizedEmail) ? "admin" : "user",
        planBillingCycle: "monthly",
      });
    } else {
      let shouldSave = false;

      if (!user.googleId) {
        // Link existing user with Google
        user.googleId = googleId;
        user.authProvider = "google";
        shouldSave = true;
      }

      if (picture && !user.image) {
        user.image = picture;
        shouldSave = true;
      }

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

      if (isAdminEmail(normalizedEmail) && user.role !== "admin") {
        user.role = "admin";
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
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

    const systemAccess = await enforceSystemAccess({ user });
    if (!systemAccess.ok) {
      return systemAccess.response;
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Create auth token with user info and permissions
    const authToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        planId: user.planId,
        sv: user.sessionVersion ?? 1,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      authToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        billing: await getUserBillingSummary(user),
        sessionVersion: user.sessionVersion ?? 1,
      },
    });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
