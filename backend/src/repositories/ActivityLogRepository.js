const BaseRepository = require('./BaseRepository');
const ActivityLog = require('../models/ActivityLog');

class ActivityLogRepository extends BaseRepository {
  constructor() {
    super(ActivityLog);
  }

  async findRecentLogs(limit = 50) {
    return await this.model.find().sort({ timestamp: -1 }).limit(limit).exec();
  }
}

module.exports = new ActivityLogRepository();
