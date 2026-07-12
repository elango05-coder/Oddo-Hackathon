const ReportService = require('../services/ReportService');
const ApiResponse = require('../utils/response');

class ReportController {
  async getAssetUtilization(req, res, next) {
    try {
      const result = await ReportService.getAssetUtilization();
      res.status(200).json(ApiResponse.success(result, 'Asset utilization statistics loaded.'));
    } catch (error) {
      next(error);
    }
  }

  async getMaintenanceStats(req, res, next) {
    try {
      const result = await ReportService.getMaintenanceStats();
      res.status(200).json(ApiResponse.success(result, 'Maintenance statistics loaded.'));
    } catch (error) {
      next(error);
    }
  }

  async getIdleAssets(req, res, next) {
    try {
      const result = await ReportService.getIdleAssets();
      res.status(200).json(ApiResponse.success(result, 'Idle assets retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async getPopularAssets(req, res, next) {
    try {
      const result = await ReportService.getPopularAssets();
      res.status(200).json(ApiResponse.success(result, 'Popular resources retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async exportAssetsToCSV(req, res, next) {
    try {
      const csv = await ReportService.exportAssetsToCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=assets-report.csv');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
