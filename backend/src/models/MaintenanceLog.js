const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRequest',
      required: [true, 'Maintenance request reference is required'],
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
    },
    actionPerformed: {
      type: String,
      required: [true, 'Action description is required'],
      trim: true,
    },
    performedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Operator user reference is required'],
    },
    loggedAt: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
maintenanceLogSchema.index({ requestId: 1 });
maintenanceLogSchema.index({ assetId: 1 });
maintenanceLogSchema.index({ isDeleted: 1 });

// Soft delete query helper
maintenanceLogSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);
module.exports = MaintenanceLog;
