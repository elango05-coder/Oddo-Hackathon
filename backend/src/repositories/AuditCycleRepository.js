const BaseRepository = require('./BaseRepository');
const AuditCycle = require('../models/AuditCycle');

class AuditCycleRepository extends BaseRepository {
  constructor() {
    super(AuditCycle);
  }

  async findActiveCycle() {
    return await this.model.findOne({ status: 'InProgress' }).exec();
  }
}

module.exports = new AuditCycleRepository();
