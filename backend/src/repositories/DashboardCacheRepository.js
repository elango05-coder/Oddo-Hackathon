const BaseRepository = require('./BaseRepository');
const DashboardCache = require('../models/DashboardCache');

class DashboardCacheRepository extends BaseRepository {
  constructor() {
    super(DashboardCache);
  }

  async getCache(key) {
    const cached = await this.model.findOne({ key }).exec();
    if (cached && cached.expiresAt > new Date()) {
      return cached.value;
    }
    return null;
  }

  async setCache(key, value, durationInMs) {
    const expiresAt = new Date(Date.now() + durationInMs);
    return await this.model.findOneAndUpdate(
      { key },
      { value, expiresAt },
      { upsert: true, new: true }
    ).exec();
  }
}

module.exports = new DashboardCacheRepository();
