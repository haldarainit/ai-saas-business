import mongoose from "mongoose";

// Type definitions for nested objects
export interface IAttendee {
    name: string;
    email: string;
    phone?: string;
    customResponses?: Map<string, string>;
}

export interface IReminderSent {
    type: "24h" | "1h" | "confirmation" | "cancellation" | "reschedule" | "followup";
    sentAt: Date;
    channel: "email" | "sms";
}

export interface IBooking extends mongoose.Document {
    bookingId: string;
    userId: string;
    eventTypeId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    date: string; // "2025-12-20"
    startTime: string; // "10:00"
    endTime: string; // "10:30"
    timezone: string;
    duration: number; // in minutes
    attendee: IAttendee;
    locationType: "video" | "phone" | "in-person" | "custom";
    location?: string;
    meetingLink?: string;
    meetingProvider?: string;
    status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show" | "rescheduled";
    googleCalendarEventId?: string;
    outlookCalendarEventId?: string;
    remindersSent: IReminderSent[];
    cancelledAt?: Date;
    cancellationReason?: string;
    cancelledBy?: "host" | "attendee";
    rescheduledFrom?: mongoose.Types.ObjectId;
    rescheduledTo?: mongoose.Types.ObjectId;
    paymentStatus: "not_required" | "pending" | "paid" | "refunded";
    paymentAmount?: number;
    paymentCurrency?: string;
    hostNotes?: string;
    attendeeNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const attendeeSchema = new mongoose.Schema<IAttendee>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    customResponses: { type: Map, of: String }, // Responses to custom questions
});

const reminderSentSchema = new mongoose.Schema<IReminderSent>({
    type: { type: String, enum: ["24h", "1h", "confirmation", "cancellation", "reschedule", "followup"] },
    sentAt: { type: Date },
    channel: { type: String, enum: ["email", "sms"] },
});

const bookingSchema = new mongoose.Schema<IBooking>({
    // Unique booking ID for public reference
    bookingId: {
        type: String,
        required: true,
        unique: true,
        default: () => `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    },

    // References
    userId: { type: String, required: true, index: true }, // The host
    eventTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "EventType", required: true },

    // Booking details
    title: { type: String, required: true },
    description: String,
    date: { type: String, required: true }, // "2025-12-20"
    startTime: { type: String, required: true }, // "10:00"
    endTime: { type: String, required: true }, // "10:30"
    timezone: { type: String, default: "Asia/Kolkata" },
    duration: { type: Number, required: true }, // in minutes

    // Attendee information
    attendee: attendeeSchema,

    // Meeting type
    locationType: {
        type: String,
        enum: ["video", "phone", "in-person", "custom"],
        default: "video"
    },
    location: String, // Address or custom location
    meetingLink: String, // Auto-generated meeting link
    meetingProvider: String, // "google-meet", "zoom", etc.

    // Status
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed", "no-show", "rescheduled"],
        default: "confirmed",
        index: true
    },

    // Google Calendar integration
    googleCalendarEventId: String,
    outlookCalendarEventId: String,

    // Reminders
    remindersSent: [reminderSentSchema],

    // Cancellation/Reschedule info
    cancelledAt: Date,
    cancellationReason: String,
    cancelledBy: { type: String, enum: ["host", "attendee"] },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    rescheduledTo: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },

    // Payment (if applicable)
    paymentStatus: {
        type: String,
        enum: ["not_required", "pending", "paid", "refunded"],
        default: "not_required"
    },
    paymentAmount: Number,
    paymentCurrency: String,

    // Notes
    hostNotes: String,
    attendeeNotes: String,

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Indexes for efficient querying
bookingSchema.index({ userId: 1, date: 1 });
bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ "attendee.email": 1 });

bookingSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const Booking = mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;
