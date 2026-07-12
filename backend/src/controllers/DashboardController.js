const DashboardService = require('../services/DashboardService');
const ApiResponse = require('../utils/response');

class DashboardController {
  async getDashboardData(req, res, next) {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const result = await DashboardService.getDashboardData(forceRefresh);
      res.status(200).json(ApiResponse.success(result, 'Dashboard KPIs loaded.'));
    } catch (error) {
      next(error);
    }
  }

  async rebuildCache(req, res, next) {
    try {
      const result = await DashboardService.rebuildCache();
      res.status(200).json(ApiResponse.success(result, 'Dashboard cache refreshed.'));
    } catch (error) {
      next(error);
    }
  }

  async seedDemoData(req, res, next) {
    try {
      const seedDemo = require('../database/demoSeeder');
      const result = await seedDemo();
      // After seeding, force rebuild the dashboard cache
      await DashboardService.rebuildCache();
      res.status(200).json(ApiResponse.success(result, 'Demo database seeded successfully.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
