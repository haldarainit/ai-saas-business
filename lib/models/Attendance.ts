import mongoose from 'mongoose';

// Type definitions for nested objects
export interface ILocation {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    address?: string;
}

export interface IClockRecord {
    time: Date;
    location?: ILocation;
    faceImage?: string;
    faceMatchScore?: number;
    deviceInfo?: string;
}

export interface IAttendance extends mongoose.Document {
    userId: string;
    employeeId: string;
    employeeName: string;
    date: string; // Format: YYYY-MM-DD
    clockIn: IClockRecord;
    clockOut?: {
        time?: Date;
        location?: ILocation;
        faceImage?: string;
        faceMatchScore?: number;
        deviceInfo?: string;
    };
    workingHours: number;
    status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
    suspicious: boolean;
    suspiciousFlags: string[];
    retryAttempts: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const attendanceSchema = new mongoose.Schema<IAttendance>({
    // User association for data isolation
    userId: {
        type: String,
        required: true,
        index: true,
    },
    employeeId: {
        type: String,
        required: true,
        index: true,
    },
    employeeName: {
        type: String,
        required: true,
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
        index: true,
    },
    clockIn: {
        time: {
            type: Date,
            required: true,
        },
        location: {
            latitude: Number,
            longitude: Number,
            accuracy: Number,
            address: String,
        },
        faceImage: String, // base64 image
        faceMatchScore: Number,
        deviceInfo: String,
    },
    clockOut: {
        time: Date,
        location: {
            latitude: Number,
            longitude: Number,
            accuracy: Number,
            address: String,
        },
        faceImage: String,
        faceMatchScore: Number,
        deviceInfo: String,
    },
    workingHours: {
        type: Number, // in hours
        default: 0,
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half-day', 'on-leave'],
        default: 'present',
    },
    suspicious: {
        type: Boolean,
        default: false,
    },
    suspiciousFlags: [String],
    retryAttempts: {
        type: Number,
        default: 0,
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index for efficient queries
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Update timestamp on save
attendanceSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Calculate working hours before saving
attendanceSchema.pre('save', function (next) {
    if (this.clockIn?.time && this.clockOut?.time) {
        const clockInTime = this.clockIn.time instanceof Date ? this.clockIn.time : new Date(this.clockIn.time);
        const clockOutTime = this.clockOut.time instanceof Date ? this.clockOut.time : new Date(this.clockOut.time);
        const diff = clockOutTime.getTime() - clockInTime.getTime();
        this.workingHours = Number((diff / (1000 * 60 * 60)).toFixed(2)); // Convert to hours
    }
    next();
});

const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', attendanceSchema);

export default Attendance;
