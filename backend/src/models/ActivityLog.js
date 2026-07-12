const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    collectionName: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false }, // Only need timestamp of creation
  }
);

// Indexes for auditing
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ collectionName: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ recordId: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
module.exports = ActivityLog;
