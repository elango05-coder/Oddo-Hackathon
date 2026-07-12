const AssetRepository = require('../repositories/AssetRepository');
const AssetAllocationRepository = require('../repositories/AssetAllocationRepository');
const MaintenanceRequestRepository = require('../repositories/MaintenanceRequestRepository');
const BookingRepository = require('../repositories/BookingRepository');
const DepartmentRepository = require('../repositories/DepartmentRepository');

class ReportService {
  async getAssetUtilization() {
    return await AssetRepository.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: 1 },
          allocated: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Allocated'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'assetcategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          category: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
          total: 1,
          allocated: 1,
          utilizationRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$allocated', '$total'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $project: {
          category: 1,
          utilizationRate: { $round: ['$utilizationRate', 2] }
        }
      }
    ]);
  }

  async getMaintenanceStats() {
    return await MaintenanceRequestRepository.aggregate([
      { $match: { isDeleted: { $ne: true }, status: 'Resolved' } },
      {
        $lookup: {
          from: 'assets',
          localField: 'assetId',
          foreignField: '_id',
          as: 'assetInfo'
        }
      },
      {
        $unwind: {
          path: '$assetInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$assetInfo.categoryId',
          totalCost: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } }
        }
      },
      {
        $lookup: {
          from: 'assetcategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          category: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
          totalCost: 1
        }
      }
    ]);
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
