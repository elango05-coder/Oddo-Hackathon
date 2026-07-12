const BaseRepository = require('./BaseRepository');
const AssetCategory = require('../models/AssetCategory');

class AssetCategoryRepository extends BaseRepository {
  constructor() {
    super(AssetCategory);
  }

  async findByCode(code) {
    return await this.model.findOne({ code }).exec();
  }
}

module.exports = new AssetCategoryRepository();
