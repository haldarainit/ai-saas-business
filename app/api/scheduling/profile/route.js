import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserProfile from "@/lib/models/UserProfile";

// GET - Fetch user profile
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const username = searchParams.get("username");

        if (!userId && !username) {
            return NextResponse.json(
                { error: "User ID or username is required" },
                { status: 400 }
            );
        }

        const query = userId ? { userId } : { username };
        const userProfile = await UserProfile.findOne(query);

        if (!userProfile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        const profileResponse = {
            success: true,
            profile: {
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
            },
        };

        return NextResponse.json(profileResponse);
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// POST - Create user profile
export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
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
        return NextResponse.json(
            { error: error.message || "Failed to create profile" },
            { status: 500 }
        );
    }
}

// PUT - Update user profile
export async function PUT(request) {
    try {
        await connectDB();

        const body = await request.json();
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
        let userProfile = await UserProfile.findOne({ userId });

        if (!userProfile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        // Handle emailSettings separately (nested object)
        if (updates.emailSettings) {
            if (!userProfile.emailSettings) {
                userProfile.emailSettings = {};
            }
            Object.assign(userProfile.emailSettings, updates.emailSettings);
            userProfile.markModified('emailSettings');
            delete updates.emailSettings;
        }

        // Handle notifications separately (nested object)
        if (updates.notifications) {
            if (!userProfile.notifications) {
                userProfile.notifications = {};
            }
            Object.assign(userProfile.notifications, updates.notifications);
            userProfile.markModified('notifications');
            delete updates.notifications;
        }

        // Apply other updates
        Object.assign(userProfile, updates);
        userProfile.updatedAt = new Date();
        await userProfile.save();

        return NextResponse.json({
            success: true,
            profile: userProfile,
            bookingLink: `/book/${userProfile.username}`,
            message: "Profile updated successfully",
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update profile" },
            { status: 500 }
        );
    }
}
