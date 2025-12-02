import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    index: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
  leaveType: {
    type: String,
    enum: ['sick', 'vacation', 'personal', 'emergency', 'casual', 'annual'],
    required: true,
  },
  fromDate: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true,
  },
  toDate: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  days: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  approvedBy: {
    type: String, // Admin/Manager name or ID
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
leaveSchema.index({ employeeId: 1, status: 1 });
leaveSchema.index({ fromDate: 1, toDate: 1 });
leaveSchema.index({ status: 1, appliedAt: -1 });

// Update timestamp on save
leaveSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Leave = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);

export default Leave;

