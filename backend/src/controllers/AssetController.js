const AssetService = require('../services/AssetService');
const ApiResponse = require('../utils/response');

class AssetController {
  async registerAsset(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      
      // Parse metadata if sent as stringified JSON from form data
      if (req.body.metadata && typeof req.body.metadata === 'string') {
        try {
          req.body.metadata = JSON.parse(req.body.metadata);
        } catch (e) {
          // ignore parsing error if it's already an object or invalid
        }
      }

      const result = await AssetService.registerAsset(req.body, req.files, triggeredByUser);
      res.status(201).json(ApiResponse.created(result, 'Asset registered successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async updateAsset(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };

      if (req.body.metadata && typeof req.body.metadata === 'string') {
        try {
          req.body.metadata = JSON.parse(req.body.metadata);
        } catch (e) {
          // ignore
        }
      }

      const result = await AssetService.updateAsset(req.params.id, req.body, req.files, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Asset updated successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async searchAssets(req, res, next) {
    try {
      const result = await AssetService.searchAssets(req.query);
      res.status(200).json(ApiResponse.success(result.items, 'Assets search results.', 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      }));
    } catch (error) {
      next(error);
    }
  }

  async getAssetDetail(req, res, next) {
    try {
      const result = await AssetService.getAssetDetail(req.params.id);
      res.status(200).json(ApiResponse.success(result, 'Asset details loaded.'));
    } catch (error) {
      next(error);
    }
  }

  async getAssetHistory(req, res, next) {
    try {
      const result = await AssetService.getAssetHistory(req.params.id);
      res.status(200).json(ApiResponse.success(result, 'Asset transaction history loaded.'));
    } catch (error) {
      next(error);
    }
  }

  async deleteAsset(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      await AssetService.deleteAsset(req.params.id, triggeredByUser);
      res.status(200).json(ApiResponse.success(null, 'Asset record deleted.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetController();
