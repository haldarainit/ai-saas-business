import { NextRequest, NextResponse } from "next/server";

// Type definitions
interface Attendee {
    email: string;
    name?: string;
}

interface Appointment {
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    timeZone?: string;
    attendees?: Attendee[];
    type?: string;
    eventId?: string;
}

interface CalendarRequestBody {
    action: string;
    accessToken?: string;
    appointment?: Appointment;
    timeMin?: string;
    timeMax?: string;
}

interface GoogleErrorResponse {
    error?: {
        message?: string;
    };
    error_description?: string;
}

// Google Calendar API Integration
// Note: In production, you would use OAuth2 for proper authentication

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: CalendarRequestBody = await request.json();
        const { action, accessToken, appointment } = body;

        if (!action) {
            return NextResponse.json(
                { error: "Action is required" },
                { status: 400 }
            );
        }

        switch (action) {
            case "list-events":
                return await listEvents(accessToken!);

            case "create-event":
                return await createEvent(accessToken!, appointment!);

            case "update-event":
                return await updateEvent(accessToken!, appointment!);

            case "delete-event":
                return await deleteEvent(accessToken!, appointment!.eventId!);

            case "get-free-busy":
                return await getFreeBusy(accessToken!, body.timeMin, body.timeMax);

            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Google Calendar API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// List events from Google Calendar
async function listEvents(accessToken: string): Promise<NextResponse> {
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        const error: GoogleErrorResponse = await response.json();
        throw new Error(error.error?.message || "Failed to fetch events");
    }

    const data = await response.json();
    return NextResponse.json({ events: data.items || [] });
}

// Create a new event in Google Calendar
async function createEvent(accessToken: string, appointment: Appointment): Promise<NextResponse> {
    const event = {
        summary: appointment.title,
        description: appointment.description,
        start: {
            dateTime: `${appointment.date}T${appointment.startTime}:00`,
            timeZone: appointment.timeZone || "Asia/Kolkata",
        },
        end: {
            dateTime: `${appointment.date}T${appointment.endTime}:00`,
            timeZone: appointment.timeZone || "Asia/Kolkata",
        },
        attendees: appointment.attendees?.map((a) => ({
            email: a.email,
            displayName: a.name,
        })),
        reminders: {
            useDefault: false,
            overrides: [
                { method: "email", minutes: 24 * 60 }, // 24 hours before
                { method: "popup", minutes: 60 }, // 1 hour before
                { method: "popup", minutes: 10 }, // 10 minutes before
            ],
        },
        conferenceData: appointment.type === "video" ? {
            createRequest: {
                requestId: Date.now().toString(),
                conferenceSolutionKey: { type: "hangoutsMeet" },
            },
        } : undefined,
    };

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
        }
    );

    if (!response.ok) {
        const error: GoogleErrorResponse = await response.json();
        throw new Error(error.error?.message || "Failed to create event");
    }

    const data = await response.json();
    return NextResponse.json({
        success: true,
        event: {
            id: data.id,
            htmlLink: data.htmlLink,
            meetingLink: data.conferenceData?.entryPoints?.[0]?.uri,
        },
    });
}

// Update an existing event
async function updateEvent(accessToken: string, appointment: Appointment): Promise<NextResponse> {
    const event = {
        summary: appointment.title,
        description: appointment.description,
        start: {
            dateTime: `${appointment.date}T${appointment.startTime}:00`,
            timeZone: appointment.timeZone || "Asia/Kolkata",
        },
        end: {
            dateTime: `${appointment.date}T${appointment.endTime}:00`,
            timeZone: appointment.timeZone || "Asia/Kolkata",
        },
    };

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.eventId}?sendUpdates=all`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
        }
    );

    if (!response.ok) {
        const error: GoogleErrorResponse = await response.json();
        throw new Error(error.error?.message || "Failed to update event");
    }

    return NextResponse.json({ success: true });
}

// Delete an event
async function deleteEvent(accessToken: string, eventId: string): Promise<NextResponse> {
    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok && response.status !== 204) {
        const error: GoogleErrorResponse = await response.json();
        throw new Error(error.error?.message || "Failed to delete event");
    }

    return NextResponse.json({ success: true });
}

// Get free/busy information
async function getFreeBusy(accessToken: string, timeMin?: string, timeMax?: string): Promise<NextResponse> {
    const requestBody = {
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [{ id: "primary" }],
    };

    const response = await fetch(
        "https://www.googleapis.com/calendar/v3/freeBusy",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        }
    );

    if (!response.ok) {
        const error: GoogleErrorResponse = await response.json();
        throw new Error(error.error?.message || "Failed to get free/busy info");
    }

    const data = await response.json();
    const busySlots = data.calendars?.primary?.busy || [];

    return NextResponse.json({ busySlots });
}

// Handle GET requests for OAuth callback
export async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json(
            { error: "Authorization code is required" },
            { status: 400 }
        );
    }

    try {
        // Exchange authorization code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google`,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenResponse.ok) {
            const error: GoogleErrorResponse = await tokenResponse.json();
            throw new Error(error.error_description || "Failed to exchange code");
        }

        // In a real app, you would store these tokens securely
        // and associate them with the user

        // Redirect back to the dashboard with success
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/appointment-scheduling/dashboard?connected=true`
        );
    } catch (error) {
        console.error("OAuth Error:", error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/appointment-scheduling/dashboard?error=oauth_failed`
        );
    }
}
