const DepartmentService = require('../services/DepartmentService');
const ApiResponse = require('../utils/response');

class DepartmentController {
  async createDepartment(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await DepartmentService.createDepartment(req.body, triggeredByUser);
      res.status(201).json(ApiResponse.created(result, 'Department created successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await DepartmentService.updateDepartment(req.params.id, req.body, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Department updated successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentHierarchy(req, res, next) {
    try {
      const result = await DepartmentService.getDepartmentHierarchy();
      res.status(200).json(ApiResponse.success(result, 'Department hierarchy loaded.'));
    } catch (error) {
      next(error);
    }
  }

  async deactivateDepartment(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await DepartmentService.deactivateDepartment(req.params.id, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Department deactivated successfully.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DepartmentController();
