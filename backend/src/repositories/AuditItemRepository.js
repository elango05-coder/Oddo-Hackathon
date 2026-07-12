const BaseRepository = require('./BaseRepository');
const AuditItem = require('../models/AuditItem');

class AuditItemRepository extends BaseRepository {
  constructor() {
    super(AuditItem);
  }

  async findItemsByCycle(cycleId) {
    return await this.model.find({ cycleId }).exec();
  }

  async findItemInCycle(cycleId, assetId) {
    return await this.model.findOne({ cycleId, assetId }).exec();
  }
}

module.exports = new AuditItemRepository();
