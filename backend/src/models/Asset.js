const mongoose = require('mongoose');
const { ASSET_STATES } = require('../constants');

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    tag: {
      type: String,
      required: [true, 'Asset tag is required'],
      unique: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetCategory',
      required: [true, 'Asset category is required'],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    status: {
      type: String,
      required: [true, 'Asset status is required'],
      enum: Object.values(ASSET_STATES),
      default: ASSET_STATES.AVAILABLE,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
    purchaseCost: {
      type: Number,
      required: [true, 'Purchase cost is required'],
      min: [0, 'Purchase cost cannot be negative'],
    },
    lifecycleStage: {
      type: String,
      default: 'Procured',
    },
    qrCodeUrl: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    documents: {
      type: [String],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    currentHolderId: {
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
assetSchema.index({ categoryId: 1 });
assetSchema.index({ departmentId: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ currentHolderId: 1 });
assetSchema.index({ isDeleted: 1 });

// Soft delete query helper
assetSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const Asset = mongoose.model('Asset', assetSchema);
module.exports = Asset;
