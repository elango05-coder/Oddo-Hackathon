const AllocationService = require('../services/AllocationService');
const AssetAllocationRepository = require('../repositories/AssetAllocationRepository');
const TransferRequestRepository = require('../repositories/TransferRequestRepository');
const ApiResponse = require('../utils/response');

class AllocationController {
  async allocateAsset(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AllocationService.allocateAsset(req.body, triggeredByUser);
      res.status(201).json(ApiResponse.created(result, 'Asset checked out successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async requestTransfer(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AllocationService.requestTransfer(req.body, triggeredByUser);
      res.status(201).json(ApiResponse.created(result, 'Asset transfer request submitted.'));
    } catch (error) {
      next(error);
    }
  }

  async approveTransfer(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        roleId: req.user.roleId,
        departmentId: req.user.departmentId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AllocationService.approveTransfer(req.params.id, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Asset transfer request approved.'));
    } catch (error) {
      next(error);
    }
  }

  async rejectTransfer(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        roleId: req.user.roleId,
        departmentId: req.user.departmentId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AllocationService.rejectTransfer(req.params.id, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Asset transfer request rejected.'));
    } catch (error) {
      next(error);
    }
  }

  async returnAsset(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AllocationService.returnAsset(req.body, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Asset return processed successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async getActiveAllocations(req, res, next) {
    try {
      const result = await AssetAllocationRepository.find({ status: 'Active' }, { populate: 'assetId assigneeId' });
      res.status(200).json(ApiResponse.success(result, 'Active allocations retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async getPendingTransfers(req, res, next) {
    try {
      const result = await TransferRequestRepository.find({ status: 'Pending' }, { populate: 'assetId fromUserId toUserId' });
      res.status(200).json(ApiResponse.success(result, 'Pending transfer requests retrieved.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AllocationController();
