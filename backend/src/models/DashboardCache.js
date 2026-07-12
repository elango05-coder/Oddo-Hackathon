const mongoose = require('mongoose');

const dashboardCacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Cache key is required'],
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Cache value is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Cache expiration time is required'],
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete documents when expiresAt is reached
dashboardCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DashboardCache = mongoose.model('DashboardCache', dashboardCacheSchema);
module.exports = DashboardCache;
