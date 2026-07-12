const BaseRepository = require('./BaseRepository');
const Asset = require('../models/Asset');

class AssetRepository extends BaseRepository {
  constructor() {
    super(Asset);
  }

  async findByTag(tag) {
    return await this.model.findOne({ tag }).exec();
  }

  async findLatestAssetInYear(year) {
    // Finds the asset with tag starting with AST-year- to generate sequence
    const regex = new RegExp(`^AST-${year}-`);
    return await this.model.findOne({ tag: regex }).sort({ tag: -1 }).exec();
  }

  async updateAssetStatus(assetId, status, currentHolderId = null, session = null) {
    const updateData = { status };
    if (currentHolderId !== undefined) {
      updateData.currentHolderId = currentHolderId;
    }
    return await this.update({ _id: assetId }, updateData, { session });
  }
}

module.exports = new AssetRepository();
