import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: String,
  department: String,
  position: String,
  joinDate: {
    type: Date,
    default: Date.now,
  },
  profileImage: String, // base64 reference image for face matching
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave', 'terminated'],
    default: 'active',
  },
  workSchedule: {
    startTime: String, // e.g., "09:00"
    endTime: String, // e.g., "18:00"
    workingDays: [Number], // 0-6 (Sunday to Saturday)
  },
  leaveBalance: {
    casual: { type: Number, default: 10 },
    sick: { type: Number, default: 10 },
    annual: { type: Number, default: 15 },
  },
  salary: {
    basic: Number,
    allowances: Number,
    deductions: Number,
  },
  geofence: {
    enabled: {
      type: Boolean,
      default: false,
    },
    center: {
      latitude: Number,
      longitude: Number,
    },
    radius: {
      type: Number,
      default: 1000, // Default 1km radius
    },
  },
  // Authentication fields
  password: {
    type: String,
    select: false, // Don't include password in queries by default
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationExpiry: Date,
  attendanceToken: {
    type: String,
    unique: true,
    sparse: true, // Allow null values
  },
  passwordChangeRequired: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
employeeSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

export default Employee;
