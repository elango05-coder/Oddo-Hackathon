const NotificationRepository = require('../repositories/NotificationRepository');
const ApiResponse = require('../utils/response');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const result = await NotificationRepository.find({ userId: req.user.id });
      res.status(200).json(ApiResponse.success(result, 'Notifications loaded.'));
    } catch (error) {
      next(error);
    }
  }

  async getUnreadNotifications(req, res, next) {
    try {
      const result = await NotificationRepository.findUnreadByUserId(req.user.id);
      res.status(200).json(ApiResponse.success(result, 'Unread notifications loaded.'));
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req, res, next) {
    try {
      await NotificationRepository.markAllAsRead(req.user.id);
      res.status(200).json(ApiResponse.success(null, 'All notifications marked as read.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
