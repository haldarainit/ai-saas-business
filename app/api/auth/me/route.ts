import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserBillingSummary } from "@/lib/billing/subscription";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "No active session found" },
        { status: 401 }
      );
    }

    const billing = await getUserBillingSummary(user);
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      onboardingCompleted: user.onboardingCompleted || false,
      role: user.role || "user",
      billing,
    };

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
