import mongoose from "mongoose";

const customQuestionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
        type: String,
        enum: ["text", "textarea", "email", "phone", "select", "checkbox", "radio"],
        default: "text"
    },
    required: { type: Boolean, default: false },
    options: [String], // For select, radio, checkbox
    placeholder: String,
});

const eventTypeSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    bookingLinkId: { type: String, unique: true, sparse: true }, // Unique random ID for booking URL
    description: { type: String, default: "" },
    duration: { type: Number, required: true, default: 30 }, // in minutes
    color: { type: String, default: "#6366f1" },
    location: {
        type: {
            type: String,
            enum: ["video", "phone", "in-person", "custom"],
            default: "video"
        },
        value: String, // For in-person: address, for custom: custom link
        provider: {
            type: String,
            enum: ["google-meet", "zoom", "teams", "custom"],
            default: "google-meet"
        }
    },
    customQuestions: [customQuestionSchema],
    isActive: { type: Boolean, default: true },
    requiresConfirmation: { type: Boolean, default: false },
    allowReschedule: { type: Boolean, default: true },
    allowCancellation: { type: Boolean, default: true },
    maxBookingsPerDay: { type: Number, default: 0 }, // 0 = unlimited
    bufferTimeBefore: { type: Number, default: 0 }, // minutes before meeting
    bufferTimeAfter: { type: Number, default: 0 }, // minutes after meeting
    minimumNotice: { type: Number, default: 60 }, // minimum minutes before booking (default 1 hour)
    schedulingWindow: { type: Number, default: 30 }, // days in advance to allow booking
    price: { type: Number, default: 0 }, // 0 = free
    currency: { type: String, default: "USD" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create unique slug per user
eventTypeSchema.index({ userId: 1, slug: 1 }, { unique: true });

// Pre-save hook to update timestamp and generate unique booking link ID
eventTypeSchema.pre("save", function (next) {
    this.updatedAt = new Date();

    // Generate unique booking link ID if not exists
    if (!this.bookingLinkId) {
        this.bookingLinkId = generateBookingLinkId();
    }
    next();
});

// Generate slug from name if not provided
eventTypeSchema.pre("save", function (next) {
    if (!this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }
    next();
});

// Helper function to generate unique booking link ID
function generateBookingLinkId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const EventType = mongoose.models.EventType || mongoose.model("EventType", eventTypeSchema);

export default EventType;
