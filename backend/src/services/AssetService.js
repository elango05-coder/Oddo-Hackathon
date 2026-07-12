const AssetRepository = require('../repositories/AssetRepository');
const CategoryService = require('./CategoryService');
const DepartmentRepository = require('../repositories/DepartmentRepository');
const UserRepository = require('../repositories/UserRepository');
const { generateQRCodeUrl } = require('../helpers/qrCode');
const { uploadToCloudinary } = require('../helpers/cloudinary');
const appEventEmitter = require('../events/eventEmitter');
const { BadRequestError, NotFoundError, ValidationError } = require('../utils/errors');
const { ASSET_STATES } = require('../constants');

class AssetService {
  async registerAsset(assetData, files, triggeredByUser) {
    const { name, categoryId, departmentId, serialNumber, purchaseDate, purchaseCost, metadata } = assetData;

    // 1. Validate Category
    const metaValidation = await CategoryService.validateMetadata(categoryId, metadata);
    if (!metaValidation.isValid) {
      throw new ValidationError(metaValidation.errors, 'Category metadata validation failed.');
    }

    // 2. Validate Department if provided
    if (departmentId) {
      const dept = await DepartmentRepository.findById(departmentId);
      if (!dept || !dept.isActive) {
        throw new BadRequestError('Specified department is invalid or inactive.');
      }
    }

    // 3. Auto-generate unique Asset Tag sequence (AST-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const latestAsset = await AssetRepository.findLatestAssetInYear(currentYear);
    
    let sequence = 1;
    if (latestAsset && latestAsset.tag) {
      const parts = latestAsset.tag.split('-');
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
    const paddedSequence = String(sequence).padStart(4, '0');
    const assetTag = `AST-${currentYear}-${paddedSequence}`;

    // 4. Generate QR code link
    const qrCodeUrl = generateQRCodeUrl(assetTag);

    // 5. Upload files to Cloudinary if available
    let imageUrl = '';
    const documentUrls = [];

    if (files) {
      if (files.image && files.image[0]) {
        const imageResult = await uploadToCloudinary(files.image[0].path, 'assets/images');
        imageUrl = imageResult.url;
      }
      if (files.documents) {
        for (const doc of files.documents) {
          const docResult = await uploadToCloudinary(doc.path, 'assets/docs');
          documentUrls.push(docResult.url);
        }
      }
    }

    const asset = await AssetRepository.create({
      name,
      tag: assetTag,
      categoryId,
      departmentId: departmentId || null,
      status: ASSET_STATES.AVAILABLE,
      serialNumber: serialNumber || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      purchaseCost: Number(purchaseCost),
      qrCodeUrl,
      imageUrl,
      documents: documentUrls,
      metadata: metadata || {},
      currentHolderId: null,
      createdBy: triggeredByUser._id,
    });

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'REGISTER_ASSET',
      collectionName: 'Assets',
      recordId: asset._id,
      newValue: asset,
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return asset;
  }

  async updateAsset(id, updateData, files, triggeredByUser) {
    const asset = await AssetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found.');
    }

    // If metadata is being updated, validate against category fields
    if (updateData.metadata) {
      const categoryId = updateData.categoryId || asset.categoryId;
      const metaValidation = await CategoryService.validateMetadata(categoryId, updateData.metadata);
      if (!metaValidation.isValid) {
        throw new ValidationError(metaValidation.errors, 'Metadata validation failed.');
      }
    }

    // Process file uploads if present
    if (files) {
      if (files.image && files.image[0]) {
        const imageResult = await uploadToCloudinary(files.image[0].path, 'assets/images');
        updateData.imageUrl = imageResult.url;
      }
      if (files.documents) {
        const docUrls = asset.documents || [];
        for (const doc of files.documents) {
          const docResult = await uploadToCloudinary(doc.path, 'assets/docs');
          docUrls.push(docResult.url);
        }
        updateData.documents = docUrls;
      }
    }

    const oldAsset = JSON.parse(JSON.stringify(asset));
    updateData.updatedBy = triggeredByUser._id;
    const updatedAsset = await AssetRepository.updateById(id, updateData);

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'UPDATE_ASSET',
      collectionName: 'Assets',
      recordId: id,
      oldValue: oldAsset,
      newValue: updatedAsset,
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return updatedAsset;
  }

  async searchAssets(queryParams) {
    const { search, q, categoryId, departmentId, status, sortBy, order, page = 1, limit = 10 } = queryParams;

    const filter = {};

    // Apply filters
    if (categoryId) filter.categoryId = categoryId;
    if (departmentId) filter.departmentId = departmentId;
    if (status) filter.status = status;

    // Apply search keyword
    const keyword = search || q;
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { tag: { $regex: keyword, $options: 'i' } },
        { serialNumber: { $regex: keyword, $options: 'i' } },
      ];
    }

    const options = {
      populate: 'categoryId departmentId currentHolderId',
      sort: {},
    };

    if (sortBy) {
      options.sort[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      options.sort.createdAt = -1; // default sort
    }

    return await AssetRepository.paginate(filter, Number(page), Number(limit), options);
  }

  async getAssetDetail(id) {
    const asset = await AssetRepository.findById(id, { populate: 'categoryId departmentId currentHolderId' });
    if (!asset) {
      throw new NotFoundError('Asset not found.');
    }
    return asset;
  }

  async getAssetHistory(assetId) {
    const AssetAllocation = require('../models/AssetAllocation');
    const MaintenanceRequest = require('../models/MaintenanceRequest');
    
    // Find all allocations and maintenance requests associated with this asset
    const allocations = await AssetAllocation.find({ assetId }).populate('assigneeId allocatedById').sort({ allocatedAt: -1 }).exec();
    const maintenance = await MaintenanceRequest.find({ assetId }).populate('reportedById assignedTechnicianId').sort({ createdAt: -1 }).exec();

    return {
      allocations,
      maintenance,
    };
  }

  async deleteAsset(id, triggeredByUser) {
    const asset = await AssetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found.');
    }

    if (asset.status === ASSET_STATES.ALLOCATED) {
      throw new BadRequestError('Cannot delete asset while it is allocated to an employee.');
    }

    const deletedAsset = await AssetRepository.deleteById(id);

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'DELETE_ASSET',
      collectionName: 'Assets',
      recordId: id,
      newValue: { isDeleted: true },
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return deletedAsset;
  }
}

module.exports = new AssetService();
