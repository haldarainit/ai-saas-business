import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Availability from "@/lib/models/Availability";

// Type definitions
interface TimeRange {
    start: string;
    end: string;
}

interface DaySchedule {
    enabled: boolean;
    timeRanges: TimeRange[];
}

interface WeeklySchedule {
    sunday: DaySchedule;
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
}

interface DateOverride {
    date: string;
    isBlocked: boolean;
    timeRanges: TimeRange[];
}

interface AvailabilityData {
    userId: string;
    timezone: string;
    weeklySchedule: WeeklySchedule;
    dateOverrides: DateOverride[];
    bufferBetweenMeetings: number;
    minimumNotice: number;
    schedulingWindow: number;
}

interface AvailabilityBody {
    userId: string;
    timezone?: string;
    weeklySchedule?: WeeklySchedule;
    dateOverrides?: DateOverride[];
    bufferBetweenMeetings?: number;
    minimumNotice?: number;
    schedulingWindow?: number;
}

interface DateOverrideBody {
    userId: string;
    date: string;
    isBlocked?: boolean;
    timeRanges?: TimeRange[];
    remove?: boolean;
}

// GET - Fetch user availability
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        let availability = await Availability.findOne({ userId });

        // Return default availability if not set
        if (!availability) {
            const defaultAvailability: AvailabilityData = {
                userId,
                timezone: "Asia/Kolkata",
                weeklySchedule: {
                    sunday: { enabled: false, timeRanges: [] },
                    monday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
                    tuesday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
                    wednesday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
                    thursday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
                    friday: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] },
                    saturday: { enabled: false, timeRanges: [] },
                },
                dateOverrides: [],
                bufferBetweenMeetings: 0,
                minimumNotice: 60,
                schedulingWindow: 30,
            };
            return NextResponse.json({
                success: true,
                availability: defaultAvailability,
            });
        }

        return NextResponse.json({
            success: true,
            availability,
        });
    } catch (error) {
        console.error("Error fetching availability:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch availability";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// POST/PUT - Create or update availability
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const body: AvailabilityBody = await request.json();
        const { userId, ...settings } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const availability = await Availability.findOneAndUpdate(
            { userId },
            { ...settings, userId, updatedAt: new Date() },
            { new: true, upsert: true }
        );

        return NextResponse.json({
            success: true,
            availability,
            message: "Availability updated successfully",
        });
    } catch (error) {
        console.error("Error updating availability:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update availability";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// PUT - Same as POST (upsert)
export async function PUT(request: NextRequest): Promise<NextResponse> {
    return POST(request);
}

// PATCH - Add or update date override
export async function PATCH(request: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const body: DateOverrideBody = await request.json();
        const { userId, date, isBlocked, timeRanges, remove } = body;

        if (!userId || !date) {
            return NextResponse.json(
                { error: "User ID and date are required" },
                { status: 400 }
            );
        }

        let availability = await Availability.findOne({ userId });

        if (!availability) {
            availability = new Availability({ userId });
        }

        // Find existing override for this date
        const existingIndex = availability.dateOverrides.findIndex(
            (o: DateOverride) => o.date === date
        );

        if (remove) {
            // Remove the override
            if (existingIndex !== -1) {
                availability.dateOverrides.splice(existingIndex, 1);
            }
        } else {
            // Add or update override
            const override: DateOverride = {
                date,
                isBlocked: isBlocked || false,
                timeRanges: timeRanges || [],
            };

            if (existingIndex !== -1) {
                availability.dateOverrides[existingIndex] = override;
            } else {
                availability.dateOverrides.push(override);
            }
        }

        await availability.save();

        return NextResponse.json({
            success: true,
            availability,
            message: remove ? "Date override removed" : "Date override updated",
        });
    } catch (error) {
        console.error("Error updating date override:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update date override";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
