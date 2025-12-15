import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import EventType from "@/lib/models/EventType";
import Availability from "@/lib/models/Availability";
import Booking from "@/lib/models/Booking";

// GET - Get available time slots for a specific event type and date
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const eventTypeId = searchParams.get("eventTypeId");
        const date = searchParams.get("date"); // Format: YYYY-MM-DD
        const timezone = searchParams.get("timezone") || "Asia/Kolkata";

        if (!eventTypeId || !date) {
            return NextResponse.json(
                { error: "Event type ID and date are required" },
                { status: 400 }
            );
        }

        // Get event type
        const eventType = await EventType.findById(eventTypeId);
        if (!eventType) {
            return NextResponse.json(
                { error: "Event type not found" },
                { status: 404 }
            );
        }

        // Get user availability
        const availability = await Availability.findOne({ userId: eventType.userId });

        // Get day of week
        const dateObj = new Date(date);
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = dayNames[dateObj.getDay()];

        // Check for date override
        const dateOverride = availability?.dateOverrides?.find(o => o.date === date);

        let daySchedule;
        if (dateOverride) {
            if (dateOverride.isBlocked) {
                return NextResponse.json({
                    success: true,
                    slots: [],
                    message: "This date is not available for booking",
                });
            }
            daySchedule = dateOverride.timeRanges;
        } else if (availability?.weeklySchedule?.[dayName]) {
            const schedule = availability.weeklySchedule[dayName];
            if (!schedule.enabled || schedule.timeRanges.length === 0) {
                return NextResponse.json({
                    success: true,
                    slots: [],
                    message: "No availability on this day",
                });
            }
            daySchedule = schedule.timeRanges;
        } else {
            // Default schedule if no availability set
            daySchedule = [{ start: "09:00", end: "17:00" }];
        }

        // Get existing bookings for this date
        const existingBookings = await Booking.find({
            userId: eventType.userId,
            date,
            status: { $nin: ["cancelled", "rescheduled"] },
        });

        // Calculate buffer times
        const bufferBefore = eventType.bufferTimeBefore || 0;
        const bufferAfter = eventType.bufferTimeAfter || 0;
        const bufferBetween = availability?.bufferBetweenMeetings || 0;
        const totalBuffer = Math.max(bufferAfter, bufferBetween);

        // Generate time slots
        const slots = [];
        const duration = eventType.duration;
        const now = new Date();
        const minimumNotice = eventType.minimumNotice || 60;

        for (const timeRange of daySchedule) {
            const [startHour, startMin] = timeRange.start.split(":").map(Number);
            const [endHour, endMin] = timeRange.end.split(":").map(Number);

            let currentHour = startHour;
            let currentMin = startMin;

            while (true) {
                const slotStart = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

                // Calculate slot end
                let slotEndMin = currentMin + duration;
                let slotEndHour = currentHour;
                while (slotEndMin >= 60) {
                    slotEndMin -= 60;
                    slotEndHour++;
                }

                const slotEnd = `${String(slotEndHour).padStart(2, "0")}:${String(slotEndMin).padStart(2, "0")}`;

                // Check if slot end exceeds range end
                const slotEndInMins = slotEndHour * 60 + slotEndMin;
                const rangeEndInMins = endHour * 60 + endMin;

                if (slotEndInMins > rangeEndInMins) {
                    break;
                }

                // Check if slot is in the past or doesn't meet minimum notice
                const slotDateTime = new Date(`${date}T${slotStart}:00`);
                const minutesUntilSlot = (slotDateTime - now) / 60000;

                let available = minutesUntilSlot >= minimumNotice;

                // Check for conflicts with existing bookings
                if (available) {
                    for (const booking of existingBookings) {
                        const bookingStart = booking.startTime;
                        const bookingEnd = booking.endTime;

                        // Add buffer to booking times
                        const [bsH, bsM] = bookingStart.split(":").map(Number);
                        const [beH, beM] = bookingEnd.split(":").map(Number);

                        const bookingStartMins = bsH * 60 + bsM - bufferBefore;
                        const bookingEndMins = beH * 60 + beM + totalBuffer;

                        const slotStartMins = currentHour * 60 + currentMin;
                        const slotEndMins = slotEndHour * 60 + slotEndMin;

                        // Check overlap
                        if (slotStartMins < bookingEndMins && slotEndMins > bookingStartMins) {
                            available = false;
                            break;
                        }
                    }
                }

                slots.push({
                    time: slotStart,
                    endTime: slotEnd,
                    available,
                    formattedTime: formatTime(slotStart),
                });

                // Move to next slot
                currentMin += 15; // 15-minute increments
                while (currentMin >= 60) {
                    currentMin -= 60;
                    currentHour++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            date,
            eventType: {
                id: eventType._id,
                name: eventType.name,
                duration: eventType.duration,
            },
            slots,
            timezone,
        });
    } catch (error) {
        console.error("Error fetching time slots:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch time slots" },
            { status: 500 }
        );
    }
}

// Helper function to format time
function formatTime(time24) {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}
