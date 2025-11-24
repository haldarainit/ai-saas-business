import mongoose from "mongoose";

const EmailTrackingSchema = new mongoose.Schema(
  {
    // Reference Information
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CampaignEmailHistory",
      required: true,
      index: true,
    },
    emailId: {
      type: String,
      required: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Tracking Events
    opens: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
        location: {
          country: String,
          region: String,
          city: String,
        },
        device: {
          type: String,
          browser: String,
          os: String,
        },
      },
    ],

    clicks: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        url: String,
        ipAddress: String,
        userAgent: String,
        location: {
          country: String,
          region: String,
          city: String,
        },
        device: {
          type: String,
          browser: String,
          os: String,
        },
      },
    ],

    // Summary Statistics
    firstOpenedAt: Date,
    lastOpenedAt: Date,
    totalOpens: {
      type: Number,
      default: 0,
    },
    uniqueOpens: {
      type: Number,
      default: 0,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    uniqueClicks: {
      type: Number,
      default: 0,
    },

    // Email Status
    status: {
      type: String,
      enum: ["sent", "opened", "clicked", "bounced", "complained"],
      default: "sent",
    },

    // Metadata
    emailSubject: String,
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
EmailTrackingSchema.index({ campaignId: 1, recipientEmail: 1 });
EmailTrackingSchema.index({ userId: 1, sentAt: -1 });
EmailTrackingSchema.index({ status: 1, sentAt: -1 });

// Methods
EmailTrackingSchema.methods.recordOpen = function (data) {
  const now = new Date();

  // Add open event
  this.opens.push({
    timestamp: now,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    location: data.location,
    device: data.device,
  });

  // Update statistics
  this.totalOpens = this.opens.length;

  // Calculate unique opens (based on IP address)
  const uniqueIPs = new Set(this.opens.map((open) => open.ipAddress));
  this.uniqueOpens = uniqueIPs.size;

  // Update timestamps
  if (!this.firstOpenedAt) {
    this.firstOpenedAt = now;
  }
  this.lastOpenedAt = now;

  // Update status
  if (this.status === "sent") {
    this.status = "opened";
  }

  return this.save();
};

EmailTrackingSchema.methods.recordClick = function (data) {
  const now = new Date();

  // Add click event
  this.clicks.push({
    timestamp: now,
    url: data.url,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    location: data.location,
    device: data.device,
  });

  // Update statistics
  this.totalClicks = this.clicks.length;

  // Calculate unique clicks (based on IP address)
  const uniqueIPs = new Set(this.clicks.map((click) => click.ipAddress));
  this.uniqueClicks = uniqueIPs.size;

  // Update status
  this.status = "clicked";

  return this.save();
};

// Static methods for aggregation
EmailTrackingSchema.statics.getCampaignStats = async function (campaignId) {
  const stats = await this.aggregate([
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: "$campaignId",
        totalSent: { $sum: 1 },
        totalOpened: {
          $sum: { $cond: [{ $gt: ["$totalOpens", 0] }, 1, 0] },
        },
        totalClicked: {
          $sum: { $cond: [{ $gt: ["$totalClicks", 0] }, 1, 0] },
        },
        totalOpenEvents: { $sum: "$totalOpens" },
        totalClickEvents: { $sum: "$totalClicks" },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      openRate: 0,
      clickRate: 0,
      totalOpenEvents: 0,
      totalClickEvents: 0,
    };
  }

  const result = stats[0];
  return {
    totalSent: result.totalSent,
    totalOpened: result.totalOpened,
    totalClicked: result.totalClicked,
    openRate: ((result.totalOpened / result.totalSent) * 100).toFixed(2),
    clickRate: ((result.totalClicked / result.totalSent) * 100).toFixed(2),
    totalOpenEvents: result.totalOpenEvents,
    totalClickEvents: result.totalClickEvents,
  };
};

export default mongoose.models.EmailTracking ||
  mongoose.model("EmailTracking", EmailTrackingSchema);
