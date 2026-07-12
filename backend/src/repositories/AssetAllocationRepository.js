const BaseRepository = require('./BaseRepository');
const AssetAllocation = require('../models/AssetAllocation');

class AssetAllocationRepository extends BaseRepository {
  constructor() {
    super(AssetAllocation);
  }

  async findActiveAllocation(assetId) {
    return await this.model.findOne({ assetId, status: 'Active' }).exec();
  }

  async findOverdueAllocations() {
    return await this.model.find({
      status: 'Active',
      expectedReturnDate: { $lt: new Date() },
    }).exec();
  }
}

module.exports = new AssetAllocationRepository();
