const AssetRepository = require('../repositories/AssetRepository');
const AssetAllocationRepository = require('../repositories/AssetAllocationRepository');
const MaintenanceRequestRepository = require('../repositories/MaintenanceRequestRepository');
const BookingRepository = require('../repositories/BookingRepository');
const DepartmentRepository = require('../repositories/DepartmentRepository');

class ReportService {
  async getAssetUtilization() {
    const totalAssets = await AssetRepository.count({});
    const allocated = await AssetRepository.count({ status: 'Allocated' });
    const maintenance = await AssetRepository.count({ status: 'UnderMaintenance' });
    const available = await AssetRepository.count({ status: 'Available' });

    const utilizationRate = totalAssets > 0 ? (allocated / totalAssets) * 100 : 0;

    return {
      totalAssets,
      allocatedCount: allocated,
      maintenanceCount: maintenance,
      availableCount: available,
      utilizationRate: Number(utilizationRate.toFixed(2)),
    };
  }

  async getMaintenanceStats() {
    // Total maintenance costs and ticket durations
    const tickets = await MaintenanceRequestRepository.find({ status: 'Resolved' });
    
    let totalCost = 0;
    let avgCost = 0;
    
    tickets.forEach((ticket) => {
      totalCost += ticket.actualCost;
    });

    if (tickets.length > 0) {
      avgCost = totalCost / tickets.length;
    }

    // Cost by priority
    const priorityStats = await MaintenanceRequestRepository.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          totalCost: { $sum: '$actualCost' },
        },
      },
    ]);

    return {
      resolvedTicketsCount: tickets.length,
      totalMaintenanceCost: totalCost,
      averageRepairCost: Number(avgCost.toFixed(2)),
      priorityStats,
    };
  }

  async getIdleAssets() {
    // Assets that have been "Available" and not checked out recently
    return await AssetRepository.find({
      status: 'Available',
    }, {
      populate: 'categoryId departmentId',
      limit: 20,
    });
  }

  async getPopularAssets() {
    // Most booked resources
    return await BookingRepository.aggregate([
      {
        $group: {
          _id: '$resourceId',
          bookingCount: { $sum: 1 },
        },
      },
      {
        $sort: { bookingCount: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'assets',
          localField: '_id',
          foreignField: '_id',
          as: 'resource',
        },
      },
      {
        $unwind: '$resource',
      },
      {
        $project: {
          resourceId: '$_id',
          name: '$resource.name',
          tag: '$resource.tag',
          bookingCount: 1,
        },
      },
    ]);
  }

  // Generates CSV output for assets
  async exportAssetsToCSV() {
    const assets = await AssetRepository.find({}, { populate: 'categoryId departmentId currentHolderId' });
    
    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Department', 'Status', 'Serial Number', 'Purchase Date', 'Purchase Cost', 'Current Holder'];
    const rows = assets.map((asset) => [
      asset.tag,
      `"${asset.name.replace(/"/g, '""')}"`,
      asset.categoryId ? `"${asset.categoryId.name.replace(/"/g, '""')}"` : 'N/A',
      asset.departmentId ? `"${asset.departmentId.name.replace(/"/g, '""')}"` : 'N/A',
      asset.status,
      asset.serialNumber || 'N/A',
      asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : 'N/A',
      asset.purchaseCost,
      asset.currentHolderId ? `"${asset.currentHolderId.name.replace(/"/g, '""')}"` : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}

module.exports = new ReportService();
