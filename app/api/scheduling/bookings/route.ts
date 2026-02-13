import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking, { type IBooking } from "@/lib/models/Booking";
import EventType, { type IEventType } from "@/lib/models/EventType";
import Availability, { type IAvailability } from "@/lib/models/Availability";
import UserProfile, { type IUserProfile } from "@/lib/models/UserProfile";
import {
  createGoogleMeetEvent,
  refreshAccessToken,
} from "@/lib/services/meeting-link";

interface CreateBookingRequest {
  eventTypeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  attendee: {
    name: string;
    email: string;
    phone?: string;
  };
  attendeeNotes?: string;
  timezone?: string;
}

const NON_BLOCKING_STATUSES = ["cancelled", "rescheduled"];

function addMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function validateDate(
  date: string,
  time: string,
  minimumNotice: number,
  schedulingWindow: number,
): string | null {
  const slot = new Date(`${date}T${time}:00`);
  if (Number.isNaN(slot.getTime())) {
    return "Invalid date or time";
  }

  const now = new Date();
  const minutesUntilSlot = (slot.getTime() - now.getTime()) / 60000;
  if (minutesUntilSlot < minimumNotice) {
    return `This event requires at least ${minimumNotice} minutes notice`;
  }

  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + schedulingWindow);
  if (slot > maxDate) {
    return `Bookings are only allowed ${schedulingWindow} days in advance`;
  }

  return null;
}

async function ensureGoogleAccessToken(
  profile: IUserProfile | null,
): Promise<string | null> {
  if (!profile?.googleCalendar?.connected) {
    return null;
  }

  const tokens = profile.googleCalendar;
  if (!tokens?.accessToken) {
    return null;
  }

  const expiry =
    tokens.tokenExpiry ? new Date(tokens.tokenExpiry).getTime() : null;
  const hasValidToken = expiry ? expiry - Date.now() > 60 * 1000 : true;
  if (hasValidToken) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    return tokens.accessToken;
  }

  try {
    const refreshed = await refreshAccessToken(tokens.refreshToken, {
      clientId: tokens.clientId || undefined,
      clientSecret: tokens.clientSecret || undefined,
    });

    profile.googleCalendar.accessToken = refreshed.accessToken;
    profile.googleCalendar.tokenExpiry = new Date(refreshed.expiresAt);
    profile.markModified("googleCalendar");
    await profile.save();
    return refreshed.accessToken;
  } catch (error) {
    console.error("Failed to refresh Google Calendar token", error);
    return tokens.accessToken;
  }
}

function buildBookingResponse(booking: IBooking) {
  return {
    id: booking._id,
    bookingId: booking.bookingId,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    timezone: booking.timezone,
    duration: booking.duration,
    attendee: booking.attendee,
    status: booking.status,
    meetingLink: booking.meetingLink,
    locationType: booking.locationType,
    location: booking.location,
    meetingProvider: booking.meetingProvider,
    attendeeNotes: booking.attendeeNotes,
    googleCalendarEventId: booking.googleCalendarEventId,
    eventTypeId: booking.eventTypeId,
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const eventTypeId = searchParams.get("eventTypeId");
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);

    const query: Record<string, unknown> = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (date) query.date = date;
    if (eventTypeId) query.eventTypeId = eventTypeId;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ date: 1, startTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("eventTypeId", "name color location duration"),
      Booking.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize: limit,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch bookings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = (await request.json()) as CreateBookingRequest;
    const { eventTypeId, date, startTime, attendee, attendeeNotes, timezone } =
      body;

    if (
      !eventTypeId ||
      !date ||
      !startTime ||
      !attendee?.name ||
      !attendee?.email
    ) {
      return NextResponse.json(
        { error: "Missing required booking details" },
        { status: 400 },
      );
    }

    const eventType: IEventType | null = await EventType.findById(eventTypeId);
    if (!eventType || !eventType.isActive) {
      return NextResponse.json(
        { error: "Event type not found or inactive" },
        { status: 404 },
      );
    }

    const [availability, hostProfile]: [
      IAvailability | null,
      IUserProfile | null,
    ] = await Promise.all([
      Availability.findOne({ userId: eventType.userId }),
      UserProfile.findOne({ userId: eventType.userId }),
    ]);

    const minimumNotice = Math.max(
      eventType.minimumNotice || 0,
      availability?.minimumNotice || 0,
    );
    const schedulingWindow =
      eventType.schedulingWindow || availability?.schedulingWindow || 30;
    const validationError = validateDate(
      date,
      startTime,
      minimumNotice,
      schedulingWindow,
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const startMinutes = toMinutes(startTime);
    const endTime = addMinutes(startTime, eventType.duration);
    const endMinutes = startMinutes + eventType.duration;

    const existingBookings = await Booking.find({
      userId: eventType.userId,
      date,
      status: { $nin: NON_BLOCKING_STATUSES },
    });

    if (eventType.maxBookingsPerDay && eventType.maxBookingsPerDay > 0) {
      const dayCount = existingBookings.length;
      if (dayCount >= eventType.maxBookingsPerDay) {
        return NextResponse.json(
          { error: "This day is fully booked" },
          { status: 409 },
        );
      }
    }

    const bufferBefore = eventType.bufferTimeBefore || 0;
    const bufferAfter = eventType.bufferTimeAfter || 0;
    const bufferBetween = availability?.bufferBetweenMeetings || 0;
    const effectiveBufferAfter = Math.max(bufferAfter, bufferBetween);

    const hasConflict = existingBookings.some((booking) => {
      const bookingStart = toMinutes(booking.startTime) - bufferBefore;
      const bookingEnd = toMinutes(booking.endTime) + effectiveBufferAfter;
      return startMinutes < bookingEnd && endMinutes > bookingStart;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "Selected time slot is no longer available" },
        { status: 409 },
      );
    }

    const bookingTimezone =
      timezone ||
      availability?.timezone ||
      hostProfile?.defaultTimezone ||
      "UTC";
    const locationType = eventType.location?.type || "video";
    const meetingProvider =
      eventType.location?.provider ||
      (locationType === "video" ? "google-meet" : "custom");

    let meetingLink: string | undefined;
    let googleCalendarEventId: string | undefined;

    if (locationType === "video" && hostProfile?.googleCalendar?.connected) {
      const accessToken = await ensureGoogleAccessToken(hostProfile);
      if (accessToken) {
        try {
          const meeting = await createGoogleMeetEvent({
            accessToken,
            refreshToken: hostProfile.googleCalendar?.refreshToken || undefined,
            clientId: hostProfile.googleCalendar?.clientId || undefined,
            clientSecret: hostProfile.googleCalendar?.clientSecret || undefined,
            title: eventType.name,
            description: eventType.description,
            date,
            startTime,
            endTime,
            timezone: bookingTimezone,
            attendees: [{ email: attendee.email, name: attendee.name }],
          });
          meetingLink = meeting.meetingLink;
          googleCalendarEventId = meeting.eventId;
        } catch (error) {
          console.error("Failed to create Google Meet event", error);
        }
      }
    }

    if (!meetingLink && locationType === "video" && eventType.location?.value) {
      meetingLink = eventType.location.value;
    }

    const bookingData: Partial<IBooking> = {
      userId: eventType.userId,
      eventTypeId: eventType._id,
      title: eventType.name,
      description: eventType.description,
      date,
      startTime,
      endTime,
      timezone: bookingTimezone,
      duration: eventType.duration,
      attendee,
      locationType,
      location: eventType.location?.value,
      meetingLink,
      meetingProvider,
      status: eventType.requiresConfirmation ? "pending" : "confirmed",
      attendeeNotes,
    };

    if (googleCalendarEventId) {
      bookingData.googleCalendarEventId = googleCalendarEventId;
    }

    const booking = await Booking.create(bookingData);

    return NextResponse.json({
      success: true,
      booking: buildBookingResponse(booking),
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
