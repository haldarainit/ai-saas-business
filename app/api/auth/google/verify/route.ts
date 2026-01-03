import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export async function POST(req: NextRequest) {
  try {
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

    // Connect to database
    await connectDB();

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        name: name || body.name,
        googleId,
        image: picture || body.image,
        authProvider: "google",
      });
    } else if (!user.googleId) {
      // Link existing user with Google
      user.googleId = googleId;
      user.authProvider = "google";
      if (picture) user.image = picture;
      await user.save();
    }

    // Create auth token with user info and permissions
    const authToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      process.env.NEXTAUTH_SECRET ||
        process.env.JWT_SECRET ||
        "fallback-secret",
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      authToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
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
