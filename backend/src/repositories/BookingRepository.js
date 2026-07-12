const BaseRepository = require('./BaseRepository');
const Booking = require('../models/Booking');

class BookingRepository extends BaseRepository {
  constructor() {
    super(Booking);
  }

  async findOverlappingBookings(resourceId, startTime, endTime, excludeBookingId = null) {
    const filter = {
      resourceId,
      status: 'Upcoming',
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) },
    };

    if (excludeBookingId) {
      filter._id = { $ne: excludeBookingId };
    }

    return await this.model.find(filter).exec();
  }

  async findUpcomingBookings() {
    return await this.model.find({
      status: 'Upcoming',
      startTime: { $gt: new Date() },
    }).exec();
  }
}

module.exports = new BookingRepository();
