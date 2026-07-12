const BookingService = require('../services/BookingService');
const ApiResponse = require('../utils/response');

class BookingController {
  async bookResource(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await BookingService.bookResource(req.body, triggeredByUser);
      res.status(201).json(ApiResponse.created(result, 'Resource booked successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async rescheduleBooking(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        roleId: req.user.roleId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await BookingService.rescheduleBooking(req.params.id, req.body, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Booking rescheduled.'));
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        roleId: req.user.roleId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await BookingService.cancelBooking(req.params.id, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Booking cancelled.'));
    } catch (error) {
      next(error);
    }
  }

  async getCalendar(req, res, next) {
    try {
      const { resourceId, startDate, endDate } = req.query;
      const result = await BookingService.getCalendar(resourceId, startDate, endDate);
      res.status(200).json(ApiResponse.success(result, 'Calendar schedule retrieved.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();
