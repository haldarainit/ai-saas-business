import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    console.log("Me API called");

    // First, try to get user from auth-token cookie (traditional login)
    const token = request.cookies.get("auth-token")?.value;
    console.log("Token present:", !!token);

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        console.log("Token decoded:", decoded);

        await dbConnect();
        console.log("Database connected for me check");

        // Find user by ID
        const user = await User.findById(decoded.userId).select("-password");
        console.log("User found for me:", !!user);

        if (user) {
          const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            onboardingCompleted: user.onboardingCompleted || false,
          };

          console.log("Me response sent for user:", user.email, "onboardingCompleted:", user.onboardingCompleted);
          return NextResponse.json({ user: userResponse });
        }
      } catch (tokenError) {
        console.log("Token verification failed, trying NextAuth session");
      }
    }

    // If no valid auth-token, try NextAuth session (Google login)
    const session = await getServerSession(authOptions);
    console.log("NextAuth session:", !!session);

    if (session?.user?.email) {
      await dbConnect();
      const user = await User.findOne({ email: session.user.email }).select("-password");

      if (user) {
        const userResponse = {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          onboardingCompleted: user.onboardingCompleted || false,
        };

        console.log("Me response sent for user (via session):", user.email, "onboardingCompleted:", user.onboardingCompleted);
        return NextResponse.json({ user: userResponse });
      }
    }

    console.log("No token or session provided");
    return NextResponse.json(
      { error: "No authentication token provided" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
