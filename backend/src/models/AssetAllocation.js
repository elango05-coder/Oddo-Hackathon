const mongoose = require('mongoose');

const assetAllocationSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assignee is required'],
    },
    allocatedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Allocated by user is required'],
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      required: [true, 'Expected return date is required'],
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Returned', 'Overdue'],
      default: 'Active',
    },
    conditionOnAllocation: {
      type: String,
      required: [true, 'Condition on allocation is required'],
      trim: true,
    },
    conditionOnReturn: {
      type: String,
      default: null,
      trim: true,
    },
    transferHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TransferRequest',
      },
    ],
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
assetAllocationSchema.index({ assetId: 1 });
assetAllocationSchema.index({ assigneeId: 1 });
assetAllocationSchema.index({ status: 1 });
assetAllocationSchema.index({ isDeleted: 1 });

// Soft delete query helper
assetAllocationSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const AssetAllocation = mongoose.model('AssetAllocation', assetAllocationSchema);
module.exports = AssetAllocation;
