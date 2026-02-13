import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserProfile from "@/lib/models/UserProfile";
import { exchangeCodeForTokens } from "@/lib/services/meeting-link";

// Type definitions
interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  email?: string;
}

interface StateData {
  userId: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    request.nextUrl.origin
  ).replace(/\/$/, "");

  // Handle OAuth error
  if (error) {
    console.error("OAuth Error:", error);
    return NextResponse.redirect(
      `${appUrl}/appointment-scheduling/dashboard?tab=settings&error=oauth_denied`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/appointment-scheduling/dashboard?tab=settings&error=no_code`,
    );
  }

  try {
    await connectDB();

    // Decode state to get userId
    let userId: string | undefined;
    try {
      const stateData: StateData = JSON.parse(
        Buffer.from(state || "", "base64").toString("utf-8"),
      );
      userId = stateData.userId;
    } catch {
      // Fallback: state might just be the userId
      userId = Buffer.from(state || "", "base64").toString("utf-8");
    }

    if (!userId) {
      throw new Error("User ID not found in OAuth state");
    }

    // Get user's Google credentials
    const userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const clientId = userProfile.googleCalendar?.clientId;
    const clientSecret = userProfile.googleCalendar?.clientSecret;

    if (!clientId || !clientSecret) {
      throw new Error("Google API credentials not configured");
    }

    // Exchange code for tokens using user's credentials
    const tokens: TokenResponse = await exchangeCodeForTokens(code, {
      clientId,
      clientSecret,
      appUrl,
    });

    if (!tokens.accessToken) {
      throw new Error("Failed to get access token");
    }

    // Update user profile with tokens
    await UserProfile.updateOne(
      { userId },
      {
        $set: {
          "googleCalendar.connected": true,
          "googleCalendar.accessToken": tokens.accessToken,
          "googleCalendar.refreshToken": tokens.refreshToken,
          "googleCalendar.tokenExpiry":
            tokens.expiresAt ? new Date(tokens.expiresAt) : null,
          "googleCalendar.calendarId": "primary",
          "googleCalendar.connectedEmail": tokens.email,
        },
      },
    );

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      `${appUrl}/appointment-scheduling/dashboard?tab=settings&calendar=connected`,
    );
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      `${appUrl}/appointment-scheduling/dashboard?tab=settings&error=${encodeURIComponent(errorMessage)}`,
    );
  }
}
