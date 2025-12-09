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
    required: true,
  },
  fromDate: {
    type: Date,
    required: true,
    index: true,
  },
  toDate: {
    type: Date,
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
leaveSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
leaveSchema.index({ employeeId: 1, fromDate: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

const Leave = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);

export default Leave;

