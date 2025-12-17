import mongoose from "mongoose";

const timeRangeSchema = new mongoose.Schema({
    start: { type: String, required: true }, // "09:00"
    end: { type: String, required: true }, // "17:00"
});

const weeklyScheduleSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: true },
    timeRanges: [timeRangeSchema],
});

const dateOverrideSchema = new mongoose.Schema({
    date: { type: String, required: true }, // "2025-12-20"
    isBlocked: { type: Boolean, default: false }, // If true, completely unavailable
    timeRanges: [timeRangeSchema], // Custom hours for this day
});

const availabilitySchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    timezone: { type: String, default: "Asia/Kolkata" },

    // Weekly recurring schedule
    weeklySchedule: {
        sunday: { type: weeklyScheduleSchema, default: { enabled: false, timeRanges: [] } },
        monday: { type: weeklyScheduleSchema, default: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] } },
        tuesday: { type: weeklyScheduleSchema, default: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] } },
        wednesday: { type: weeklyScheduleSchema, default: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] } },
        thursday: { type: weeklyScheduleSchema, default: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] } },
        friday: { type: weeklyScheduleSchema, default: { enabled: true, timeRanges: [{ start: "09:00", end: "17:00" }] } },
        saturday: { type: weeklyScheduleSchema, default: { enabled: false, timeRanges: [] } },
    },

    // Date-specific overrides (holidays, custom hours)
    dateOverrides: [dateOverrideSchema],

    // Buffer time between meetings (in minutes)
    bufferBetweenMeetings: { type: Number, default: 0 },

    // Minimum notice required for booking (in minutes)
    minimumNotice: { type: Number, default: 60 }, // 1 hour default

    // How far in advance can people book (in days)
    schedulingWindow: { type: Number, default: 30 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

availabilitySchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const Availability = mongoose.models.Availability || mongoose.model("Availability", availabilitySchema);

export default Availability;
