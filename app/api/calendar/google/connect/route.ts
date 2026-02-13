import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserProfile from "@/lib/models/UserProfile";
import {
  getGoogleCalendarAuthUrl,
  checkGoogleCalendarConnection,
} from "@/lib/services/meeting-link";

// Type definitions
interface GoogleCredentialsBody {
  userId: string;
  clientId?: string;
  clientSecret?: string;
}

interface ConnectionStatus {
  connected: boolean;
  email?: string;
  summary?: string;
}

// GET - Get Google Calendar connection status or initiate connection
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    await connectDB();
    const userProfile = await UserProfile.findOne({ userId });

    // If action is "connect", generate OAuth URL
    if (action === "connect") {
      // Check if user has configured their own credentials
      const clientId = userProfile?.googleCalendar?.clientId;
      const clientSecret = userProfile?.googleCalendar?.clientSecret;

      if (!clientId || !clientSecret) {
        return NextResponse.json({
          success: false,
          error: "Please save your Google API credentials first",
          needsCredentials: true,
        });
      }

      // Encode userId in state for callback
      const state = Buffer.from(JSON.stringify({ userId })).toString("base64");
      const appUrl =
        request.nextUrl.origin ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL;
      const authUrl = getGoogleCalendarAuthUrl({
        clientId,
        state,
        appUrl,
      });

      return NextResponse.json({
        success: true,
        authUrl,
      });
    }

    // Otherwise, return connection status
    if (!userProfile?.googleCalendar?.connected) {
      return NextResponse.json({
        success: true,
        connected: false,
        hasCredentials: !!(
          userProfile?.googleCalendar?.clientId &&
          userProfile?.googleCalendar?.clientSecret
        ),
        message: "Google Calendar not connected",
      });
    }

    // Verify the connection is still valid
    try {
      const connectionStatus: ConnectionStatus =
        await checkGoogleCalendarConnection(
          userProfile.googleCalendar.accessToken,
        );

      if (connectionStatus.connected) {
        return NextResponse.json({
          success: true,
          connected: true,
          email:
            connectionStatus.email || userProfile.googleCalendar.connectedEmail,
          calendarName: connectionStatus.summary,
          hasCredentials: true,
        });
      } else {
        return NextResponse.json({
          success: true,
          connected: false,
          expired: true,
          hasCredentials: true,
          message: "Google Calendar connection expired. Please reconnect.",
        });
      }
    } catch {
      return NextResponse.json({
        success: true,
        connected: userProfile.googleCalendar.connected,
        expired: true,
        hasCredentials: true,
        message: "Unable to verify connection status",
      });
    }
  } catch (error) {
    console.error("Error checking Google Calendar connection:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to check connection";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Save Google API credentials
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: GoogleCredentialsBody = await request.json();
    const { userId, clientId, clientSecret } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID and Client Secret are required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Find the profile first
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "User profile not found. Please refresh the page and try again.",
        },
        { status: 404 },
      );
    }

    // Initialize googleCalendar if it doesn't exist
    if (!profile.googleCalendar) {
      profile.googleCalendar = {
        connected: false,
        clientId: "",
        clientSecret: "",
        connectedEmail: "",
      };
    }

    // Update the credentials
    profile.googleCalendar.clientId = clientId.trim();
    profile.googleCalendar.clientSecret = clientSecret.trim();

    // Mark the nested object as modified (required for Mongoose to detect changes)
    profile.markModified("googleCalendar");

    // Save the profile
    await profile.save();

    return NextResponse.json({
      success: true,
      message:
        "Google API credentials saved. You can now connect your calendar.",
      credentials: {
        clientId: profile.googleCalendar.clientId || "",
        hasSecret: !!profile.googleCalendar.clientSecret,
      },
    });
  } catch (error) {
    console.error("Error saving Google credentials:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save credentials";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Disconnect Google Calendar
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const clearCredentials = searchParams.get("clearCredentials") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const updateData: Record<string, unknown> = {
      "googleCalendar.connected": false,
      "googleCalendar.accessToken": null,
      "googleCalendar.refreshToken": null,
      "googleCalendar.tokenExpiry": null,
      "googleCalendar.connectedEmail": null,
    };

    // Optionally clear credentials too
    if (clearCredentials) {
      updateData["googleCalendar.clientId"] = null;
      updateData["googleCalendar.clientSecret"] = null;
    }

    await UserProfile.updateOne({ userId }, { $set: updateData });

    return NextResponse.json({
      success: true,
      message:
        clearCredentials ?
          "Google Calendar disconnected and credentials cleared"
        : "Google Calendar disconnected",
    });
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to disconnect";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
