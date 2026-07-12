const AssetCategoryRepository = require('../repositories/AssetCategoryRepository');
const appEventEmitter = require('../events/eventEmitter');
const { BadRequestError, NotFoundError } = require('../utils/errors');

class CategoryService {
  async createCategory(categoryData, triggeredByUser) {
    const { name, code, description, fields } = categoryData;

    // Check code uniqueness
    const existingCode = await AssetCategoryRepository.findByCode(code);
    if (existingCode) {
      throw new BadRequestError(`Category code '${code}' is already registered.`);
    }

    // Validate fields format
    if (fields && !Array.isArray(fields)) {
      throw new BadRequestError('Fields must be an array of field definitions.');
    }

    // Ensure field names are camelCase or alphanumeric without special characters
    if (fields) {
      const fieldNames = new Set();
      fields.forEach((f) => {
        if (!f.name || !/^[a-zA-Z0-9_]+$/.test(f.name)) {
          throw new BadRequestError(`Invalid field name '${f.name}'. Use alphanumeric names only.`);
        }
        if (fieldNames.has(f.name)) {
          throw new BadRequestError(`Duplicate field name '${f.name}' in category.`);
        }
        fieldNames.add(f.name);
      });
    }

    const category = await AssetCategoryRepository.create({
      name,
      code,
      description,
      fields: fields || [],
      createdBy: triggeredByUser._id,
    });

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'CREATE_CATEGORY',
      collectionName: 'AssetCategories',
      recordId: category._id,
      newValue: category,
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return category;
  }

  async updateCategory(id, updateData, triggeredByUser) {
    const category = await AssetCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Asset category not found.');
    }

    // Validate fields if provided
    if (updateData.fields) {
      if (!Array.isArray(updateData.fields)) {
        throw new BadRequestError('Fields must be an array.');
      }
      const fieldNames = new Set();
      updateData.fields.forEach((f) => {
        if (!f.name || !/^[a-zA-Z0-9_]+$/.test(f.name)) {
          throw new BadRequestError(`Invalid field name '${f.name}'.`);
        }
        if (fieldNames.has(f.name)) {
          throw new BadRequestError(`Duplicate field name '${f.name}' in category.`);
        }
        fieldNames.add(f.name);
      });
    }

    const oldCategory = JSON.parse(JSON.stringify(category));
    updateData.updatedBy = triggeredByUser._id;
    
    const updatedCategory = await AssetCategoryRepository.updateById(id, updateData);

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'UPDATE_CATEGORY',
      collectionName: 'AssetCategories',
      recordId: id,
      oldValue: oldCategory,
      newValue: updatedCategory,
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return updatedCategory;
  }

  async validateMetadata(categoryId, metadata = {}) {
    const category = await AssetCategoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Asset category not found.');
    }

    const errors = {};

    category.fields.forEach((field) => {
      const value = metadata[field.name];

      // Check required constraint
      if (field.required && (value === undefined || value === null || value === '')) {
        errors[field.name] = `Field '${field.label}' is required.`;
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        // Validate type
        switch (field.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors[field.name] = `Field '${field.label}' must be a number.`;
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
              errors[field.name] = `Field '${field.label}' must be a boolean.`;
            }
            break;
          case 'date':
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              errors[field.name] = `Field '${field.label}' must be a valid date.`;
            }
            break;
          case 'text':
            if (typeof value !== 'string') {
              errors[field.name] = `Field '${field.label}' must be text.`;
            }
            break;
          default:
            break;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true };
  }
}

module.exports = new CategoryService();
