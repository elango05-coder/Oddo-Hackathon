const mongoose = require('mongoose');
const { TRANSFER_STATUS } = require('../constants');

const transferRequestSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender user is required'],
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
    },
    requestedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester user is required'],
    },
    status: {
      type: String,
      enum: Object.values(TRANSFER_STATUS),
      default: TRANSFER_STATUS.PENDING,
    },
    approvedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      required: [true, 'Transfer reason is required'],
      trim: true,
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
transferRequestSchema.index({ assetId: 1 });
transferRequestSchema.index({ status: 1 });
transferRequestSchema.index({ fromUserId: 1 });
transferRequestSchema.index({ toUserId: 1 });
transferRequestSchema.index({ isDeleted: 1 });

// Soft delete query helper
transferRequestSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);
module.exports = TransferRequest;
