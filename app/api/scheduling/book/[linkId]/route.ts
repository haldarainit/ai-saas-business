import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import EventType from "@/lib/models/EventType";
import Availability from "@/lib/models/Availability";
// Booking is imported but unused in the original code, but I'll keep it just in case
import Booking from "@/lib/models/Booking";
import UserProfile from "@/lib/models/UserProfile";

// GET - Fetch event type data by unique booking link ID
export async function GET(request: NextRequest, props: { params: Promise<{ linkId: string }> }) {
    try {
        await connectDB();

        const { linkId } = await props.params;

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

        return NextResponse.json({
            success: true,
            eventType: {
                id: eventType._id,
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
            },
            host: {
                displayName: userProfile?.displayName || "Host",
                bio: userProfile?.bio || "",
                profileImage: userProfile?.profileImage || "",
                companyName: userProfile?.companyName || "",
                companyLogo: userProfile?.companyLogo || "",
                brandColor: userProfile?.brandColor || "#6366f1",
                welcomeMessage: userProfile?.welcomeMessage || "",
                timezone: userProfile?.defaultTimezone || "Asia/Kolkata",
            },
            availability: availability ? {
                weeklySchedule: availability.weeklySchedule,
                timezone: availability.timezone,
            } : null,
        });
    } catch (error: any) {
        console.error("Error fetching booking page:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch booking page" },
            { status: 500 }
        );
    }
}
