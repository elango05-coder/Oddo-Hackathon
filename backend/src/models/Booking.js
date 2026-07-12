const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../constants');

const bookingSchema = new mongoose.Schema(
  {
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Resource asset is required'],
    },
    bookedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking user is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.UPCOMING,
    },
    reason: {
      type: String,
      trim: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
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
bookingSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ bookedById: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ isDeleted: 1 });

// Soft delete query helper
bookingSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
