import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";
import EventType from "@/lib/models/EventType";
import Availability from "@/lib/models/Availability";
import UserProfile from "@/lib/models/UserProfile";
import { createGoogleMeetEvent, refreshAccessToken } from "@/lib/services/meeting-link";

// GET - Fetch bookings
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const bookingId = searchParams.get("bookingId");
        const date = searchParams.get("date");
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Fetch single booking by ID
        if (bookingId) {
            const booking = await Booking.findOne({ bookingId }).populate("eventTypeId");

            if (!booking) {
                return NextResponse.json(
                    { error: "Booking not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, booking });
        }

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const query = { userId };

        if (date) {
            query.date = date;
        } else if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (status) {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate("eventTypeId")
            .sort({ date: 1, startTime: 1 });

        return NextResponse.json({
            success: true,
            bookings,
            total: bookings.length,
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch bookings" },
            { status: 500 }
        );
    }
}

// POST - Create a new booking
export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        const {
            eventTypeId,
            date,
            startTime,
            attendee,
            timezone,
            attendeeNotes,
        } = body;

        // Validate required fields
        if (!eventTypeId || !date || !startTime || !attendee?.name || !attendee?.email) {
            return NextResponse.json(
                { error: "Event type, date, time, and attendee information are required" },
                { status: 400 }
            );
        }

        // Get event type details
        const eventType = await EventType.findById(eventTypeId);
        if (!eventType) {
            return NextResponse.json(
                { error: "Event type not found" },
                { status: 404 }
            );
        }

        // Calculate end time
        const [hours, minutes] = startTime.split(":").map(Number);
        const startDateObj = new Date();
        startDateObj.setHours(hours, minutes, 0, 0);
        const endDateObj = new Date(startDateObj.getTime() + eventType.duration * 60000);
        const endTime = `${String(endDateObj.getHours()).padStart(2, "0")}:${String(endDateObj.getMinutes()).padStart(2, "0")}`;

        // Check for conflicts
        const conflictingBooking = await Booking.findOne({
            userId: eventType.userId,
            date,
            status: { $nin: ["cancelled", "rescheduled"] },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime },
                },
            ],
        });

        if (conflictingBooking) {
            return NextResponse.json(
                { error: "This time slot is no longer available" },
                { status: 409 }
            );
        }

        // Check minimum notice
        const now = new Date();
        const bookingDateTime = new Date(`${date}T${startTime}`);
        const minutesUntilBooking = (bookingDateTime - now) / 60000;

        if (minutesUntilBooking < eventType.minimumNotice) {
            return NextResponse.json(
                { error: `Bookings require at least ${eventType.minimumNotice} minutes notice` },
                { status: 400 }
            );
        }

        // Generate a unique booking ID
        const bookingId = `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // Get host profile to check Google Calendar connection
        const userProfile = await UserProfile.findOne({ userId: eventType.userId });

        // Generate meeting link if video conference is needed
        let meetingLink = null;
        let meetingProvider = "google-meet";
        let googleCalendarEventId = null;
        let calendarError = null;

        if (eventType.location?.type === "video") {
            // Check if Google Calendar is connected and has credentials
            const hasCredentials = userProfile?.googleCalendar?.clientId && userProfile?.googleCalendar?.clientSecret;
            const isConnected = userProfile?.googleCalendar?.connected && userProfile?.googleCalendar?.accessToken;

            if (isConnected && hasCredentials) {
                try {
                    let accessToken = userProfile.googleCalendar.accessToken;

                    // Check if token is expired and refresh if needed
                    if (userProfile.googleCalendar.tokenExpiry &&
                        new Date(userProfile.googleCalendar.tokenExpiry) < new Date()) {
                        if (userProfile.googleCalendar.refreshToken) {
                            try {
                                const refreshed = await refreshAccessToken(
                                    userProfile.googleCalendar.refreshToken,
                                    {
                                        clientId: userProfile.googleCalendar.clientId,
                                        clientSecret: userProfile.googleCalendar.clientSecret
                                    }
                                );
                                accessToken = refreshed.accessToken;

                                // Update the stored access token
                                await UserProfile.updateOne(
                                    { userId: eventType.userId },
                                    {
                                        "googleCalendar.accessToken": accessToken,
                                        "googleCalendar.tokenExpiry": new Date(refreshed.expiresAt)
                                    }
                                );
                            } catch (refreshError) {
                                console.error("Failed to refresh token:", refreshError);
                                throw new Error("Google Calendar token expired. Please reconnect in Settings.");
                            }
                        }
                    }

                    // Create Google Calendar event with Google Meet
                    const meetingResult = await createGoogleMeetEvent({
                        accessToken,
                        refreshToken: userProfile.googleCalendar.refreshToken,
                        clientId: userProfile.googleCalendar.clientId,
                        clientSecret: userProfile.googleCalendar.clientSecret,
                        title: `${eventType.name} with ${attendee.name}`,
                        description: eventType.description || `Booking ID: ${bookingId}`,
                        date,
                        startTime,
                        endTime,
                        timezone: timezone || userProfile?.defaultTimezone || "Asia/Kolkata",
                        attendees: [
                            { name: attendee.name, email: attendee.email },
                            { name: userProfile?.displayName || "Host", email: userProfile?.email }
                        ]
                    });

                    meetingLink = meetingResult.meetingLink;
                    googleCalendarEventId = meetingResult.eventId;
                    meetingProvider = "google-meet";

                } catch (error) {
                    console.error("Error creating Google Meet:", error);
                    calendarError = error.message;
                    // Don't fail the booking - just note that calendar integration failed
                }
            } else {
                calendarError = "Google Calendar not connected. Connect in Settings to auto-generate meeting links.";
            }
        }

        // Create the booking
        const booking = new Booking({
            bookingId,
            userId: eventType.userId,
            eventTypeId: eventType._id,
            title: `${eventType.name} with ${attendee.name}`,
            description: eventType.description,
            date,
            startTime,
            endTime,
            timezone: timezone || "Asia/Kolkata",
            duration: eventType.duration,
            attendee: {
                name: attendee.name,
                email: attendee.email,
                phone: attendee.phone,
                customResponses: attendee.customResponses || {},
            },
            locationType: eventType.location?.type || "video",
            location: eventType.location?.value,
            meetingLink,
            meetingProvider,
            googleCalendarEventId,
            status: eventType.requiresConfirmation ? "pending" : "confirmed",
            attendeeNotes,
        });

        await booking.save();

        return NextResponse.json({
            success: true,
            booking: {
                bookingId: booking.bookingId,
                title: booking.title,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status,
                meetingLink: booking.meetingLink,
                hostName: userProfile?.displayName || eventType.userId,
                hostEmail: userProfile?.email,
            },
            calendarError, // Return calendar error for UI to show if needed
            message: eventType.requiresConfirmation
                ? "Booking request submitted. Awaiting host confirmation."
                : "Booking confirmed successfully!",
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create booking" },
            { status: 500 }
        );
    }
}

// PUT - Update a booking (confirm, reschedule, etc.)
export async function PUT(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { bookingId, action, ...updates } = body;

        if (!bookingId) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            );
        }

        const booking = await Booking.findOne({ bookingId });

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // Handle specific actions
        switch (action) {
            case "confirm":
                booking.status = "confirmed";
                // TODO: Send confirmation email
                break;

            case "cancel":
                booking.status = "cancelled";
                booking.cancelledAt = new Date();
                booking.cancellationReason = updates.reason;
                booking.cancelledBy = updates.cancelledBy || "host";
                // TODO: Send cancellation email
                break;

            case "complete":
                booking.status = "completed";
                break;

            case "no-show":
                booking.status = "no-show";
                break;

            default:
                // General update
                Object.assign(booking, updates);
        }

        booking.updatedAt = new Date();
        await booking.save();

        return NextResponse.json({
            success: true,
            booking,
            message: `Booking ${action || "updated"} successfully`,
        });
    } catch (error) {
        console.error("Error updating booking:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update booking" },
            { status: 500 }
        );
    }
}

// DELETE - Cancel a booking
export async function DELETE(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get("bookingId");
        const reason = searchParams.get("reason");

        if (!bookingId) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            );
        }

        const booking = await Booking.findOne({ bookingId });

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        booking.status = "cancelled";
        booking.cancelledAt = new Date();
        booking.cancellationReason = reason;
        booking.updatedAt = new Date();

        await booking.save();

        // TODO: Send cancellation emails
        // TODO: Update Google Calendar if connected

        return NextResponse.json({
            success: true,
            message: "Booking cancelled successfully",
        });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        return NextResponse.json(
            { error: error.message || "Failed to cancel booking" },
            { status: 500 }
        );
    }
}
