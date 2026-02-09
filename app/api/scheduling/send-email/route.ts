import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";
import EventType from "@/lib/models/EventType";
import UserProfile from "@/lib/models/UserProfile";
import {
  sendBookingEmails,
  sendReminderEmail,
} from "@/lib/services/booking-email";

interface SendEmailRequest {
  type: "confirmation" | "reminder";
  bookingId: string;
  reminderHours?: number;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = (await request.json()) as SendEmailRequest;
    const { type, bookingId, reminderHours = 1 } = body;

    if (!type || !bookingId) {
      return NextResponse.json(
        { error: "Email type and bookingId are required" },
        { status: 400 },
      );
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const [eventType, hostProfile] = await Promise.all([
      EventType.findById(booking.eventTypeId),
      UserProfile.findOne({ userId: booking.userId }),
    ]);

    if (!eventType || !hostProfile) {
      return NextResponse.json(
        { error: "Unable to load booking context" },
        { status: 404 },
      );
    }

    const eventSummary = { name: eventType.name, duration: eventType.duration };
    const host = {
      displayName:
        hostProfile.displayName ||
        hostProfile.username ||
        hostProfile.companyName ||
        "Host",
      email: hostProfile.email,
      emailSettings: hostProfile.emailSettings,
      notifications: hostProfile.notifications,
    };

    const bookingPayload = {
      ...booking.toObject(),
      notes: booking.attendeeNotes,
    };

    let result;
    if (type === "confirmation") {
      result = await sendBookingEmails(bookingPayload, eventSummary, host);
    } else if (type === "reminder") {
      result = await sendReminderEmail(
        bookingPayload,
        eventSummary,
        host,
        host.emailSettings,
        reminderHours,
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported email type" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error sending booking email:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
