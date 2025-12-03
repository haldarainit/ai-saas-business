import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
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
    const diff = this.clockOut.time.getTime() - this.clockIn.time.getTime();
    this.workingHours = Number((diff / (1000 * 60 * 60)).toFixed(2)); // Convert to hours
  }
  next();
});

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

export default Attendance;
