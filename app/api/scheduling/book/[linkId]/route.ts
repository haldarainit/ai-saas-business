import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import EventType from "@/lib/models/EventType";
import Availability from "@/lib/models/Availability";
import UserProfile from "@/lib/models/UserProfile";

// Type definitions
interface RouteContext {
    params: Promise<{ linkId: string }>;
}

interface EventTypeResponse {
    id: string;
    name: string;
    description: string;
    duration: number;
    color: string;
    location: Record<string, unknown>;
    customQuestions: unknown[];
    minimumNotice: number;
    schedulingWindow: number;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    requiresConfirmation: boolean;
    price: number;
    currency: string;
}

interface HostResponse {
    displayName: string;
    bio: string;
    profileImage: string;
    companyName: string;
    companyLogo: string;
    brandColor: string;
    welcomeMessage: string;
    timezone: string;
}

interface AvailabilityResponse {
    weeklySchedule: Record<string, unknown>;
    timezone: string;
}

// GET - Fetch event type data by unique booking link ID
export async function GET(
    request: NextRequest,
    context: RouteContext
): Promise<NextResponse> {
    try {
        await connectDB();

        const params = await context.params;
        const { linkId } = params;

        if (!linkId) {
            return NextResponse.json(
                { error: "Booking link ID is required" },
                { status: 400 }
            );
        }

        // Find event type by bookingLinkId
        const eventType = await EventType.findOne({ bookingLinkId: linkId, isActive: true });

        if (!eventType) {
            return NextResponse.json(
                { error: "Booking page not found or is no longer active" },
                { status: 404 }
            );
        }

        // Get user profile for host info
        const userProfile = await UserProfile.findOne({ userId: eventType.userId });

        // Get availability
        const availability = await Availability.findOne({ userId: eventType.userId });

        const eventTypeResponse: EventTypeResponse = {
            id: eventType._id.toString(),
            name: eventType.name,
            description: eventType.description,
            duration: eventType.duration,
            color: eventType.color,
            location: eventType.location,
            customQuestions: eventType.customQuestions,
            minimumNotice: eventType.minimumNotice,
            schedulingWindow: eventType.schedulingWindow,
            bufferTimeBefore: eventType.bufferTimeBefore,
            bufferTimeAfter: eventType.bufferTimeAfter,
            requiresConfirmation: eventType.requiresConfirmation,
            price: eventType.price,
            currency: eventType.currency,
        };

        const hostResponse: HostResponse = {
            displayName: userProfile?.displayName || "Host",
            bio: userProfile?.bio || "",
            profileImage: userProfile?.profileImage || "",
            companyName: userProfile?.companyName || "",
            companyLogo: userProfile?.companyLogo || "",
            brandColor: userProfile?.brandColor || "#6366f1",
            welcomeMessage: userProfile?.welcomeMessage || "",
            timezone: userProfile?.defaultTimezone || "Asia/Kolkata",
        };

        const availabilityResponse: AvailabilityResponse | null = availability ? {
            weeklySchedule: availability.weeklySchedule,
            timezone: availability.timezone,
        } : null;

        return NextResponse.json({
            success: true,
            eventType: eventTypeResponse,
            host: hostResponse,
            availability: availabilityResponse,
        });
    } catch (error) {
        console.error("Error fetching booking page:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch booking page";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
