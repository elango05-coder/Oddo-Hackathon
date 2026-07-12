const CategoryService = require('../services/CategoryService');
const AssetCategoryRepository = require('../repositories/AssetCategoryRepository');
const ApiResponse = require('../utils/response');

class CategoryController {
  async createCategory(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await CategoryService.createCategory(req.body, triggeredByUser);
      res.status(201).json(ApiResponse.created(result, 'Asset category created.'));
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const triggeredByUser = {
        _id: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await CategoryService.updateCategory(req.params.id, req.body, triggeredByUser);
      res.status(200).json(ApiResponse.success(result, 'Asset category updated.'));
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const result = await AssetCategoryRepository.find({});
      res.status(200).json(ApiResponse.success(result, 'Asset categories retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async getCategory(req, res, next) {
    try {
      const result = await AssetCategoryRepository.findById(req.params.id);
      res.status(200).json(ApiResponse.success(result, 'Category detail loaded.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
