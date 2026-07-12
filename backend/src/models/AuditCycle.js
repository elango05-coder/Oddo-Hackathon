const mongoose = require('mongoose');
const { AUDIT_CYCLE_STATUS } = require('../constants');

const auditCycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Audit cycle name is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: Object.values(AUDIT_CYCLE_STATUS),
      default: AUDIT_CYCLE_STATUS.SCHEDULED,
    },
    assignedAuditors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    completedAt: {
      type: Date,
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
auditCycleSchema.index({ status: 1 });
auditCycleSchema.index({ isDeleted: 1 });

// Soft delete query helper
auditCycleSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const AuditCycle = mongoose.model('AuditCycle', auditCycleSchema);
module.exports = AuditCycle;
