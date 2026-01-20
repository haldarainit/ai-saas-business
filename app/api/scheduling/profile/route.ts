import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserProfile from "@/lib/models/UserProfile";

// Type definitions
interface GoogleCalendarSettings {
    connected: boolean;
    clientId: string;
    clientSecret: string;
    connectedEmail: string;
}

interface OutlookCalendarSettings {
    connected: boolean;
}

interface NotificationSettings {
    [key: string]: unknown;
}

interface EmailSettings {
    emailProvider: string;
    emailUser: string;
    emailPassword: string;
    fromName: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure?: boolean;
    sendConfirmationToAttendee: boolean;
    sendNotificationToHost: boolean;
    sendReminders: boolean;
    reminderHoursBefore?: number[];
}

interface ProfileBody {
    userId: string;
    email?: string;
    username?: string;
    displayName?: string;
    bio?: string;
    profileImage?: string;
    companyName?: string;
    companyLogo?: string;
    brandColor?: string;
    welcomeMessage?: string;
    googleCalendar?: Partial<GoogleCalendarSettings>;
    outlookCalendar?: Partial<OutlookCalendarSettings>;
    notifications?: NotificationSettings;
    emailSettings?: Partial<EmailSettings>;
    defaultTimezone?: string;
    defaultDuration?: number;
    defaultLocation?: string;
}

interface ProfileResponse {
    userId: string;
    email: string;
    username: string;
    displayName: string;
    bio: string;
    profileImage: string;
    companyName: string;
    companyLogo: string;
    brandColor: string;
    welcomeMessage: string;
    googleCalendar: GoogleCalendarSettings;
    outlookCalendar: OutlookCalendarSettings;
    notifications: NotificationSettings;
    emailSettings: EmailSettings;
    defaultTimezone: string;
    defaultDuration: number;
    defaultLocation: string;
    bookingLink: string;
}

// GET - Fetch user profile
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const username = searchParams.get("username");

        console.log("🔵 [API] GET /api/scheduling/profile - Request received");
        console.log("🔵 [API] Query params - userId:", userId, "username:", username);

        if (!userId && !username) {
            return NextResponse.json(
                { error: "User ID or username is required" },
                { status: 400 }
            );
        }

        const query = userId ? { userId } : { username };
        const userProfile = await UserProfile.findOne(query);

        if (!userProfile) {
            console.error("❌ [API] Profile not found for query:", query);
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        console.log("🔵 [API] Found profile for user:", userProfile.userId);
        console.log("🔵 [API] Profile emailSettings from DB:", JSON.stringify(userProfile.emailSettings, null, 2));

        const profileResponse: ProfileResponse = {
            userId: userProfile.userId,
            email: userProfile.email,
            username: userProfile.username,
            displayName: userProfile.displayName,
            bio: userProfile.bio,
            profileImage: userProfile.profileImage,
            companyName: userProfile.companyName,
            companyLogo: userProfile.companyLogo,
            brandColor: userProfile.brandColor,
            welcomeMessage: userProfile.welcomeMessage,
            googleCalendar: {
                connected: userProfile.googleCalendar?.connected || false,
                clientId: userProfile.googleCalendar?.clientId || "",
                clientSecret: userProfile.googleCalendar?.clientSecret || "",
                connectedEmail: userProfile.googleCalendar?.connectedEmail || "",
            },
            outlookCalendar: {
                connected: userProfile.outlookCalendar?.connected || false,
            },
            notifications: userProfile.notifications,
            emailSettings: {
                emailProvider: userProfile.emailSettings?.emailProvider || "gmail",
                emailUser: userProfile.emailSettings?.emailUser || "",
                emailPassword: userProfile.emailSettings?.emailPassword || "",
                fromName: userProfile.emailSettings?.fromName || "",
                smtpHost: userProfile.emailSettings?.smtpHost || "",
                smtpPort: userProfile.emailSettings?.smtpPort || 587,
                sendConfirmationToAttendee: userProfile.emailSettings?.sendConfirmationToAttendee !== false,
                sendNotificationToHost: userProfile.emailSettings?.sendNotificationToHost !== false,
                sendReminders: userProfile.emailSettings?.sendReminders !== false,
            },
            defaultTimezone: userProfile.defaultTimezone,
            defaultDuration: userProfile.defaultDuration,
            defaultLocation: userProfile.defaultLocation,
            bookingLink: `/book/${userProfile.username}`,
        };

        return NextResponse.json({
            success: true,
            profile: profileResponse,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch profile";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// POST - Create user profile
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const body: ProfileBody = await request.json();
        const { userId, email, ...settings } = body;

        if (!userId || !email) {
            return NextResponse.json(
                { error: "User ID and email are required" },
                { status: 400 }
            );
        }

        // Check if profile already exists
        let userProfile = await UserProfile.findOne({ userId });

        if (userProfile) {
            // Update existing profile
            Object.assign(userProfile, settings);
            userProfile.updatedAt = new Date();
            await userProfile.save();
        } else {
            // Create new profile
            userProfile = new UserProfile({
                userId,
                email,
                ...settings,
            });
            await userProfile.save();
        }

        return NextResponse.json({
            success: true,
            profile: userProfile,
            bookingLink: `/book/${userProfile.username}`,
            message: "Profile saved successfully",
        });
    } catch (error) {
        console.error("Error creating profile:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create profile";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// PUT - Update user profile
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const body: ProfileBody = await request.json();
        const { userId, ...updates } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Handle username change - check for uniqueness
        if (updates.username) {
            const existingProfile = await UserProfile.findOne({
                username: updates.username,
                userId: { $ne: userId },
            });

            if (existingProfile) {
                return NextResponse.json(
                    { error: "Username is already taken" },
                    { status: 409 }
                );
            }
        }

        // Find the profile first
        const userProfile = await UserProfile.findOne({ userId });

        if (!userProfile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        console.log("🟢 [API] Found user profile");
        console.log("🟢 [API] Current emailSettings:", JSON.stringify(userProfile.emailSettings, null, 2));

        // Build the update object using MongoDB $set operator
        const updateOps: Record<string, unknown> = {};

        // Handle emailSettings separately (nested object) using $set
        if (updates.emailSettings) {
            console.log("🟢 [API] Updating emailSettings...");
            console.log("🟢 [API] New emailSettings:", JSON.stringify(updates.emailSettings, null, 2));

            // Set the entire emailSettings object at once (not dot notation)
            updateOps["emailSettings"] = {
                emailProvider: updates.emailSettings.emailProvider || "gmail",
                emailUser: updates.emailSettings.emailUser || "",
                emailPassword: updates.emailSettings.emailPassword || "",
                fromName: updates.emailSettings.fromName || "",
                smtpHost: updates.emailSettings.smtpHost || "",
                smtpPort: updates.emailSettings.smtpPort || 587,
                smtpSecure: updates.emailSettings.smtpSecure || false,
                sendConfirmationToAttendee: updates.emailSettings.sendConfirmationToAttendee !== false,
                sendNotificationToHost: updates.emailSettings.sendNotificationToHost !== false,
                sendReminders: updates.emailSettings.sendReminders !== false,
                reminderHoursBefore: updates.emailSettings.reminderHoursBefore || [24, 1]
            };

            console.log("🟢 [API] Built emailSettings update (full object):", JSON.stringify(updateOps["emailSettings"], null, 2));
            delete updates.emailSettings;
        }

        // Handle notifications separately (nested object)
        if (updates.notifications) {
            console.log("🟢 [API] Updating notifications...");
            Object.keys(updates.notifications).forEach(key => {
                updateOps[`notifications.${key}`] = updates.notifications![key];
            });
            delete updates.notifications;
        }

        // Handle googleCalendar updates (if any)
        if (updates.googleCalendar) {
            console.log("🟢 [API] Updating googleCalendar...");
            Object.keys(updates.googleCalendar).forEach(key => {
                updateOps[`googleCalendar.${key}`] = (updates.googleCalendar as Record<string, unknown>)[key];
            });
            delete updates.googleCalendar;
        }

        // Add any remaining root-level updates
        Object.assign(updateOps, updates);
        updateOps.updatedAt = new Date();

        console.log("🟢 [API] Final update operations:", JSON.stringify(updateOps, null, 2));
        console.log("🟢 [API] Updating profile in database using $set...");

        // Use updateOne with $set for reliable nested object updates
        await UserProfile.updateOne(
            { userId },
            { $set: updateOps }
        );

        // Fetch the updated profile to return
        const updatedProfile = await UserProfile.findOne({ userId });

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
            bookingLink: `/book/${updatedProfile.username}`,
            message: "Profile updated successfully",
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
