const BaseRepository = require('./BaseRepository');
const MaintenanceLog = require('../models/MaintenanceLog');

class MaintenanceLogRepository extends BaseRepository {
  constructor() {
    super(MaintenanceLog);
  }

  async findByRequestId(requestId) {
    return await this.model.find({ requestId }).sort({ loggedAt: 1 }).exec();
  }
}

module.exports = new MaintenanceLogRepository();
