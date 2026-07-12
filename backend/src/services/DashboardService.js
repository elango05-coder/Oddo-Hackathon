const DashboardCacheRepository = require('../repositories/DashboardCacheRepository');
const AssetRepository = require('../repositories/AssetRepository');
const AssetAllocationRepository = require('../repositories/AssetAllocationRepository');
const TransferRequestRepository = require('../repositories/TransferRequestRepository');
const BookingRepository = require('../repositories/BookingRepository');
const MaintenanceRequestRepository = require('../repositories/MaintenanceRequestRepository');
const ActivityLogRepository = require('../repositories/ActivityLogRepository');
const { ASSET_STATES, BOOKING_STATUS, MAINTENANCE_STATUS } = require('../constants');

class DashboardService {
  async getDashboardData(forceRefresh = false) {
    const cacheKey = 'dashboard_stats';
    
    if (!forceRefresh) {
      const cachedData = await DashboardCacheRepository.getCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Refresh and calculate metrics
    const stats = await this._calculateMetrics();
    
    // Save to Cache for 1 Hour (3,600,000 ms)
    await DashboardCacheRepository.setCache(cacheKey, stats, 3600000);

    return stats;
  }

  async rebuildCache() {
    return await this.getDashboardData(true);
  }

  async _calculateMetrics() {
    // 1. Core KPIs
    const availableAssets = await AssetRepository.count({ status: ASSET_STATES.AVAILABLE });
    const allocatedAssets = await AssetRepository.count({ status: ASSET_STATES.ALLOCATED });
    const underMaintenance = await AssetRepository.count({ status: ASSET_STATES.UNDER_MAINTENANCE });
    const lostAssets = await AssetRepository.count({ status: ASSET_STATES.LOST });
    const totalAssets = await AssetRepository.count({});

    // 2. Transits & Returns
    const overdueAllocations = await AssetAllocationRepository.count({ status: 'Overdue' });
    const pendingTransfers = await TransferRequestRepository.count({ status: 'Pending' });

    // 3. Maintenance today
    const maintenanceToday = await MaintenanceRequestRepository.count({
      status: { $in: [MAINTENANCE_STATUS.APPROVED, MAINTENANCE_STATUS.IN_PROGRESS] },
    });

    // 4. Bookings Summary
    const upcomingBookings = await BookingRepository.count({ status: BOOKING_STATUS.UPCOMING });

    // 5. Recent Activity Logs
    const recentActivities = await ActivityLogRepository.find({
      populate: { path: 'userId', select: 'name email' },
      sort: { timestamp: -1 },
      limit: 10,
    });

    // 6. Departmental Summary Aggregation (Assets count per department)
    const deptSummary = await AssetRepository.aggregate([
      {
        $group: {
          _id: '$departmentId',
          count: { $sum: 1 },
          totalValue: { $sum: '$purchaseCost' },
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department',
        },
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          departmentId: '$_id',
          name: { $ifNull: ['$department.name', 'Unassigned'] },
          count: 1,
          totalValue: 1,
        },
      },
    ]);

    // 7. Category asset distribution
    const categorySummary = await AssetRepository.aggregate([
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'assetcategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          categoryId: '$_id',
          name: '$category.name',
          count: 1,
        },
      },
    ]);

    return {
      kpis: {
        availableAssets,
        allocatedAssets,
        underMaintenance,
        lostAssets,
        totalAssets,
        overdueAllocations,
        pendingTransfers,
        maintenanceToday,
        upcomingBookings,
      },
      deptSummary,
      categorySummary,
      recentActivities,
      generatedAt: new Date(),
    };
  }
}

module.exports = new DashboardService();
