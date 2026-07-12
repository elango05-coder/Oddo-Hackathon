const mongoose = require('mongoose');
const { AUDIT_ITEM_STATUS } = require('../constants');

const auditItemSchema = new mongoose.Schema(
  {
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuditCycle',
      required: [true, 'Audit cycle reference is required'],
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
    },
    auditorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Auditor reference is required'],
    },
    status: {
      type: String,
      enum: Object.values(AUDIT_ITEM_STATUS),
      required: [true, 'Verification status is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
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

// Compound Index to prevent scoring/auditing the same asset multiple times in the same cycle
auditItemSchema.index({ cycleId: 1, assetId: 1 }, { unique: true });
auditItemSchema.index({ isDeleted: 1 });
auditItemSchema.index({ auditorId: 1 });

// Soft delete query helper
auditItemSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const AuditItem = mongoose.model('AuditItem', auditItemSchema);
module.exports = AuditItem;
