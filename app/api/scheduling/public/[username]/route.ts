import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserProfile from "@/lib/models/UserProfile";
import EventType from "@/lib/models/EventType";

// Type definitions
interface RouteContext {
    params: Promise<{ username: string }>;
}

interface EventTypeDocument {
    _id: string;
    name: string;
    slug: string;
    description: string;
    duration: number;
    color: string;
    location?: { type?: string };
    price: number;
    currency: string;
}

interface ProfileResponse {
    username: string;
    displayName: string;
    bio: string;
    profileImage: string;
    companyName: string;
    companyLogo: string;
    brandColor: string;
    welcomeMessage: string;
    timezone: string;
}

interface EventTypeResponse {
    id: string;
    name: string;
    slug: string;
    description: string;
    duration: number;
    color: string;
    locationType?: string;
    price: number;
    currency: string;
    bookingLink: string;
}

// GET - Fetch public booking page data
export async function GET(
    request: NextRequest,
    context: RouteContext
): Promise<NextResponse> {
    try {
        await connectDB();

        const params = await context.params;
        const { username } = params;

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
        const eventTypes: EventTypeDocument[] = await EventType.find({
            userId: userProfile.userId,
            isActive: true,
        }).select("name slug description duration color location price currency");

        const profileResponse: ProfileResponse = {
            username: userProfile.username,
            displayName: userProfile.displayName || userProfile.username,
            bio: userProfile.bio,
            profileImage: userProfile.profileImage,
            companyName: userProfile.companyName,
            companyLogo: userProfile.companyLogo,
            brandColor: userProfile.brandColor,
            welcomeMessage: userProfile.welcomeMessage,
            timezone: userProfile.defaultTimezone,
        };

        const eventTypesResponse: EventTypeResponse[] = eventTypes.map(et => ({
            id: et._id.toString(),
            name: et.name,
            slug: et.slug,
            description: et.description,
            duration: et.duration,
            color: et.color,
            locationType: et.location?.type,
            price: et.price,
            currency: et.currency,
            bookingLink: `/book/${username}/${et.slug}`,
        }));

        return NextResponse.json({
            success: true,
            profile: profileResponse,
            eventTypes: eventTypesResponse,
        });
    } catch (error) {
        console.error("Error fetching public profile:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch profile";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
