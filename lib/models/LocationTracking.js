import mongoose from 'mongoose';

const LocationTrackingSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    index: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: Number, // GPS accuracy in meters
  },
  address: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'idle', 'away', 'offline'],
    default: 'active',
  },
  activity: {
    type: String,
    enum: ['working', 'break', 'meeting', 'traveling', 'unknown'],
    default: 'working',
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
  },
  speed: {
    type: Number, // Speed in km/h
    default: 0,
  },
  heading: {
    type: Number, // Direction in degrees (0-360)
    default: 0,
  },
  isInsideGeofence: {
    type: Boolean,
    default: true,
  },
  geofenceViolation: {
    violated: {
      type: Boolean,
      default: false,
    },
    timestamp: Date,
    location: {
      latitude: Number,
      longitude: Number,
    },
  },
  deviceInfo: {
    type: String,
    default: '',
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
LocationTrackingSchema.index({ employeeId: 1, timestamp: -1 });
LocationTrackingSchema.index({ timestamp: -1 });
LocationTrackingSchema.index({ status: 1, lastActive: -1 });

// TTL index to automatically delete old tracking data after 30 days
LocationTrackingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

// Static method to get latest location for employee
LocationTrackingSchema.statics.getLatestLocation = async function (employeeId) {
  return await this.findOne({ employeeId })
    .sort({ timestamp: -1 })
    .limit(1);
};

// Static method to get all active employees
LocationTrackingSchema.statics.getActiveEmployees = async function () {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  return await this.aggregate([
    {
      $match: {
        lastActive: { $gte: fiveMinutesAgo },
      },
    },
    {
      $sort: { timestamp: -1 },
    },
    {
      $group: {
        _id: '$employeeId',
        latestRecord: { $first: '$$ROOT' },
      },
    },
    {
      $replaceRoot: { newRoot: '$latestRecord' },
    },
  ]);
};

// Static method to get movement history
LocationTrackingSchema.statics.getMovementHistory = async function (employeeId, startDate, endDate) {
  return await this.find({
    employeeId,
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ timestamp: 1 });
};

export default mongoose.models.LocationTracking || mongoose.model('LocationTracking', LocationTrackingSchema);
