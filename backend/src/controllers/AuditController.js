const AuditService = require('../services/AuditService');
const AuditCycleRepository = require('../repositories/AuditCycleRepository');
const ApiResponse = require('../utils/response');

class AuditController {
  async createCycle(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuditService.createCycle(req.body, triggeredByUser);
      res.status(201).json(ApiResponse.created(result, 'Audit cycle created successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async startCycle(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuditService.startCycle(req.params.id, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Audit cycle started.'));
    } catch (error) {
      next(error);
    }
  }

  async verifyAsset(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        roleId: req.user.roleId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuditService.verifyAsset(req.body, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Asset verified and logged in cycle.'));
    } catch (error) {
      next(error);
    }
  }

  async generateDiscrepancyReport(req, res, next) {
    try {
      const result = await AuditService.generateDiscrepancyReport(req.params.id);
      res.status(200).json(ApiResponse.success(result, 'Discrepancy report generated.'));
    } catch (error) {
      next(error);
    }
  }

  async closeCycle(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuditService.closeCycle(req.params.id, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Audit cycle closed.'));
    } catch (error) {
      next(error);
    }
  }

  async lockCycle(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuditService.lockCycle(req.params.id, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Audit cycle locked.'));
    } catch (error) {
      next(error);
    }
  }

  async getCycles(req, res, next) {
    try {
      const result = await AuditCycleRepository.find({});
      res.status(200).json(ApiResponse.success(result, 'Audit cycles loaded.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
