import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserProfile from "@/lib/models/UserProfile";
import EventType from "@/lib/models/EventType";

// GET - Fetch public booking page data
export async function GET(request: NextRequest, props: { params: Promise<{ username: string }> }) {
    try {
        await connectDB();

        const { username } = await props.params;

        if (!username) {
            return NextResponse.json(
                { error: "Username is required" },
                { status: 400 }
            );
        }

        // Find user profile by username
        const userProfile = await UserProfile.findOne({ username });

        if (!userProfile) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Get active event types for this user
        const eventTypes = await EventType.find({
            userId: userProfile.userId,
            isActive: true,
        }).select("name slug description duration color location price currency");

        return NextResponse.json({
            success: true,
            profile: {
                username: userProfile.username,
                displayName: userProfile.displayName || userProfile.username,
                bio: userProfile.bio,
                profileImage: userProfile.profileImage,
                companyName: userProfile.companyName,
                companyLogo: userProfile.companyLogo,
                brandColor: userProfile.brandColor,
                welcomeMessage: userProfile.welcomeMessage,
                timezone: userProfile.defaultTimezone,
            },
            eventTypes: eventTypes.map(et => ({
                id: et._id,
                name: et.name,
                slug: et.slug,
                description: et.description,
                duration: et.duration,
                color: et.color,
                locationType: et.location?.type,
                price: et.price,
                currency: et.currency,
                bookingLink: `/book/${username}/${et.slug}`,
            })),
        });
    } catch (error: any) {
        console.error("Error fetching public profile:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch profile" },
            { status: 500 }
        );
    }
}
