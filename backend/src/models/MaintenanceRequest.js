const mongoose = require('mongoose');
const { MAINTENANCE_PRIORITY, MAINTENANCE_STATUS } = require('../constants');

const maintenanceRequestSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
    },
    reportedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter user is required'],
    },
    description: {
      type: String,
      required: [true, 'Maintenance description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(MAINTENANCE_PRIORITY),
      default: MAINTENANCE_PRIORITY.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.PENDING_APPROVAL,
    },
    assignedTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: [0, 'Estimated cost cannot be negative'],
    },
    actualCost: {
      type: Number,
      default: 0,
      min: [0, 'Actual cost cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
    },
    approvedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
maintenanceRequestSchema.index({ assetId: 1 });
maintenanceRequestSchema.index({ status: 1 });
maintenanceRequestSchema.index({ assignedTechnicianId: 1 });
maintenanceRequestSchema.index({ isDeleted: 1 });

// Soft delete query helper
maintenanceRequestSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
module.exports = MaintenanceRequest;
