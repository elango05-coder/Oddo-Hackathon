const mongoose = require('mongoose');

const metadataFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Field identifier name is required'],
    trim: true,
  },
  label: {
    type: String,
    required: [true, 'Field label is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Field data type is required'],
    enum: ['text', 'number', 'boolean', 'date'],
  },
  required: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const assetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fields: [metadataFieldSchema],
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
assetCategorySchema.index({ isDeleted: 1 });

// Soft delete query helper
assetCategorySchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const AssetCategory = mongoose.model('AssetCategory', assetCategorySchema);
module.exports = AssetCategory;
