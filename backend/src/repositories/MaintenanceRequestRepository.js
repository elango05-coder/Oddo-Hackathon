const BaseRepository = require('./BaseRepository');
const MaintenanceRequest = require('../models/MaintenanceRequest');

class MaintenanceRequestRepository extends BaseRepository {
  constructor() {
    super(MaintenanceRequest);
  }

  async findActiveRequestForAsset(assetId) {
    return await this.model.findOne({
      assetId,
      status: { $in: ['PendingApproval', 'Approved', 'InProgress'] },
    }).exec();
  }
}

module.exports = new MaintenanceRequestRepository();
