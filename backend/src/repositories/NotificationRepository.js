const BaseRepository = require('./BaseRepository');
const Notification = require('../models/Notification');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async findUnreadByUserId(userId) {
    return await this.model.find({ userId, isRead: false }).sort({ createdAt: -1 }).exec();
  }

  async markAllAsRead(userId) {
    return await this.model.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    ).exec();
  }
}

module.exports = new NotificationRepository();
