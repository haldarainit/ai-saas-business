import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    console.log("Me API called");
    const token = request.cookies.get("auth-token")?.value;
    console.log("Token present:", !!token);

    if (!token) {
      console.log("No token provided");
      return NextResponse.json(
        { error: "No authentication token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log("Token decoded:", decoded);

    await dbConnect();
    console.log("Database connected for me check");

    // Find user by ID
    const user = await User.findById(decoded.userId).select("-password");
    console.log("User found for me:", !!user);

    if (!user) {
      console.log("User not found for me");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };

    console.log("Me response sent for user:", user.email);
    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
