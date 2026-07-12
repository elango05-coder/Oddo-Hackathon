const BookingRepository = require('../repositories/BookingRepository');
const AssetRepository = require('../repositories/AssetRepository');
const UserRepository = require('../repositories/UserRepository');
const appEventEmitter = require('../events/eventEmitter');
const { ConflictError, BadRequestError, NotFoundError } = require('../utils/errors');
const { BOOKING_STATUS } = require('../constants');

class BookingService {
  async bookResource(bookingData, triggeredByUser) {
    // Accept both naming conventions (frontend uses startDate/endDate/purpose)
    const resourceId = bookingData.resourceId;
    const startTime = bookingData.startTime || bookingData.startDate;
    const endTime = bookingData.endTime || bookingData.endDate;
    const reason = bookingData.reason || bookingData.purpose || '';

    // 1. Verify resource exists
    const resource = await AssetRepository.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Bookable resource not found.');
    }

    if (['Retired', 'Disposed'].includes(resource.status)) {
      throw new BadRequestError(`Cannot book resource because it is ${resource.status}.`);
    }

    // 2. Validate timing
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      throw new BadRequestError('Start time must be strictly before end time.');
    }
    if (start < new Date()) {
      throw new BadRequestError('Cannot book resources in the past.');
    }

    // 3. Overlap check
    const overlaps = await BookingRepository.findOverlappingBookings(resourceId, start, end);
    if (overlaps.length > 0) {
      throw new ConflictError('The resource is already booked during this time interval.');
    }

    const booking = await BookingRepository.create({
      resourceId,
      bookedById: triggeredByUser._id,
      startTime: start,
      endTime: end,
      status: BOOKING_STATUS.UPCOMING,
      reason: reason || '',
      createdBy: triggeredByUser._id,
    });

    appEventEmitter.emit('booking.created', {
      booking,
      resource,
      user: triggeredByUser,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return booking;
  }

  async rescheduleBooking(id, reschedData, triggeredByUser) {
    // Accept both naming conventions
    const startTime = reschedData.startTime || reschedData.startDate;
    const endTime = reschedData.endTime || reschedData.endDate;
    
    const booking = await BookingRepository.findById(id);
    if (!booking || booking.status !== BOOKING_STATUS.UPCOMING) {
      throw new NotFoundError('Active upcoming booking not found.');
    }

    // Allow user who booked or admin to reschedule
    if (booking.bookedById.toString() !== triggeredByUser._id.toString() && triggeredByUser.roleId.name !== 'Admin') {
      throw new BadRequestError('You are not authorized to reschedule this booking.');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      throw new BadRequestError('Start time must be before end time.');
    }

    // Overlap checks excluding current booking
    const overlaps = await BookingRepository.findOverlappingBookings(booking.resourceId, start, end, booking._id);
    if (overlaps.length > 0) {
      throw new ConflictError('The resource is already booked during this rescheduled time.');
    }

    const oldBooking = JSON.parse(JSON.stringify(booking));
    
    booking.startTime = start;
    booking.endTime = end;
    booking.updatedBy = triggeredByUser._id;
    await booking.save();

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'RESCHEDULE_BOOKING',
      collectionName: 'Bookings',
      recordId: id,
      oldValue: oldBooking,
      newValue: booking,
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return booking;
  }

  async cancelBooking(id, triggeredByUser) {
    const booking = await BookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    if (booking.status !== BOOKING_STATUS.UPCOMING) {
      throw new BadRequestError('Only upcoming bookings can be cancelled.');
    }

    if (booking.bookedById.toString() !== triggeredByUser._id.toString() && triggeredByUser.roleId.name !== 'Admin') {
      throw new BadRequestError('You are not authorized to cancel this booking.');
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.updatedBy = triggeredByUser._id;
    await booking.save();

    const resource = await AssetRepository.findById(booking.resourceId);
    const user = await UserRepository.findById(booking.bookedById);

    appEventEmitter.emit('booking.cancelled', {
      booking,
      resource,
      user,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return booking;
  }

  async getCalendar(resourceId, startDate, endDate) {
    const filter = {
      status: { $ne: BOOKING_STATUS.CANCELLED },
    };

    // Optional resource filter
    if (resourceId) {
      filter.resourceId = resourceId;
    }

    // Only add date range if valid dates provided
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && !isNaN(start.getTime())) {
      filter.startTime = { $gte: start };
    }
    if (end && !isNaN(end.getTime())) {
      filter.endTime = { $lte: end };
    }

    return await BookingRepository.find(filter, { 
      populate: [
        { path: 'bookedById', select: 'name email' },
        { path: 'resourceId', select: 'name tag' }
      ]
    });
  }

  // Cron Job midnight executor: reminders
  async sendBookingReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = {
      status: BOOKING_STATUS.UPCOMING,
      reminderSent: false,
      startTime: { $lte: tomorrow, $gt: new Date() },
    };

    const upcomingBookings = await BookingRepository.find(filter);
    const notificationDispatcher = require('../notifications/notificationDispatcher');

    for (const booking of upcomingBookings) {
      const user = await UserRepository.findById(booking.bookedById);
      const resource = await AssetRepository.findById(booking.resourceId);

      if (user && resource) {
        booking.reminderSent = true;
        await booking.save();

        await notificationDispatcher.send({
          userId: user._id,
          title: 'Upcoming Booking Reminder',
          message: `This is a reminder that you have a booking for resource '${resource.name}' tomorrow from ${new Date(booking.startTime).toLocaleTimeString()} to ${new Date(booking.endTime).toLocaleTimeString()}.`,
          sendEmail: true,
          emailTo: user.email,
          emailSubject: 'AssetFlow - Resource Reservation Reminder',
        });
      }
    }
  }

  // Cron Job midnight executor: auto expire past bookings
  async expirePendingBookings() {
    const filter = {
      status: BOOKING_STATUS.UPCOMING,
      endTime: { $lt: new Date() },
    };

    const pastBookings = await BookingRepository.find(filter);
    for (const booking of pastBookings) {
      booking.status = BOOKING_STATUS.COMPLETED;
      await booking.save();
    }
  }
}

module.exports = new BookingService();
