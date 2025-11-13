import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    console.log("Test API called");
    await dbConnect();

    // Get all users
    const users = await User.find({}, "email name createdAt");
    const totalUsers = await User.countDocuments();

    return NextResponse.json({
      success: true,
      totalUsers,
      users: users.map((user) => ({
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
