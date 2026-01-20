import { NextRequest, NextResponse } from "next/server";
import {
    generateEventDescription,
    generateMeetingPrep,
    generateFollowUpEmail,
    analyzeBookingPatterns,
    generateWelcomeMessage,
    suggestOptimalTimeSlots
} from "@/lib/services/ai-scheduling";

// Type definitions
interface AISchedulingParams {
    action: string;
    eventName?: string;
    duration?: number;
    locationType?: string;
    hostName?: string;
    businessType?: string;
    tone?: string;
    booking?: Record<string, unknown>;
    eventType?: Record<string, unknown>;
    attendeeInfo?: Record<string, unknown>;
    bookings?: Record<string, unknown>[];
    eventTypes?: Record<string, unknown>[];
    preferences?: string;
}

interface AIResult {
    success: boolean;
    [key: string]: unknown;
}

// POST /api/scheduling/ai
// AI-powered scheduling features
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: AISchedulingParams = await request.json();
        const { action, ...params } = body;

        if (!action) {
            return NextResponse.json(
                { error: "Action is required" },
                { status: 400 }
            );
        }

        let result: AIResult;

        switch (action) {
            case "generate-description":
                // Generate AI event description
                if (!params.eventName) {
                    return NextResponse.json(
                        { error: "Event name is required" },
                        { status: 400 }
                    );
                }
                result = await generateEventDescription(
                    params.eventName,
                    params.duration || 30,
                    params.locationType || "video"
                );
                break;

            case "generate-welcome":
                // Generate welcome message for booking page
                result = await generateWelcomeMessage(
                    params.hostName || "Host",
                    params.businessType || "Professional Services",
                    params.tone || "professional"
                );
                break;

            case "meeting-prep":
                // Generate meeting preparation notes
                if (!params.booking) {
                    return NextResponse.json(
                        { error: "Booking details are required" },
                        { status: 400 }
                    );
                }
                result = await generateMeetingPrep(
                    params.booking,
                    params.eventType || {},
                    params.attendeeInfo || {}
                );
                break;

            case "follow-up-email":
                // Generate follow-up email after meeting
                if (!params.booking) {
                    return NextResponse.json(
                        { error: "Booking details are required" },
                        { status: 400 }
                    );
                }
                result = await generateFollowUpEmail(
                    params.booking,
                    params.eventType || {},
                    params.hostName || "Host"
                );
                break;

            case "analyze-patterns":
                // Analyze booking patterns and provide insights
                result = await analyzeBookingPatterns(
                    params.bookings || [],
                    params.eventTypes || []
                );
                break;

            case "suggest-slots":
                // Suggest optimal time slots
                result = await suggestOptimalTimeSlots(
                    params.bookings || [],
                    params.eventType || {},
                    params.preferences || ""
                );
                break;

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: result.success,
            ...result
        });

    } catch (error) {
        console.error("AI Scheduling API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "AI request failed";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
