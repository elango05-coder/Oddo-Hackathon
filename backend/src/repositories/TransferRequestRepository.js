const BaseRepository = require('./BaseRepository');
const TransferRequest = require('../models/TransferRequest');

class TransferRequestRepository extends BaseRepository {
  constructor() {
    super(TransferRequest);
  }

  async findPendingRequestForAsset(assetId) {
    return await this.model.findOne({ assetId, status: 'Pending' }).exec();
  }
}

module.exports = new TransferRequestRepository();
