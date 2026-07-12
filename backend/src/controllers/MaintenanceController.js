const MaintenanceService = require('../services/MaintenanceService');
const MaintenanceRequestRepository = require('../repositories/MaintenanceRequestRepository');
const ApiResponse = require('../utils/response');

class MaintenanceController {
  async raiseRequest(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await MaintenanceService.raiseRequest(req.body, req.files, triggeredByUser);
      res.status(201).json(ApiResponse.created(result, 'Maintenance request ticket raised.'));
    } catch (error) {
      next(error);
    }
  }

  async approveRequest(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await MaintenanceService.approveRequest(req.params.id, req.body, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Maintenance request approved.'));
    } catch (error) {
      next(error);
    }
  }

  async startWork(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        roleId: req.user.roleId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await MaintenanceService.startWork(req.params.id, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Maintenance work marked in progress.'));
    } catch (error) {
      next(error);
    }
  }

  async resolveRequest(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        roleId: req.user.roleId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await MaintenanceService.resolveRequest(req.params.id, req.body, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Maintenance ticket resolved.'));
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req, res, next) {
    try {
      const result = await MaintenanceService.getLogs(req.params.id);
      res.status(200).json(ApiResponse.success(result, 'Maintenance logs loaded.'));
    } catch (error) {
      next(error);
    }
  }

  async getPendingRequests(req, res, next) {
    try {
      const result = await MaintenanceRequestRepository.find(
        { status: 'PendingApproval' },
        { populate: 'assetId reportedById' }
      );
      res.status(200).json(ApiResponse.success(result, 'Pending requests loaded.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MaintenanceController();
