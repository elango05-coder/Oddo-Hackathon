const mongoose = require('mongoose');
const MaintenanceRequestRepository = require('../repositories/MaintenanceRequestRepository');
const MaintenanceLogRepository = require('../repositories/MaintenanceLogRepository');
const AssetRepository = require('../repositories/AssetRepository');
const UserRepository = require('../repositories/UserRepository');
const { uploadToCloudinary } = require('../helpers/cloudinary');
const { runInTransaction } = require('../helpers/transaction');
const appEventEmitter = require('../events/eventEmitter');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { ASSET_STATES, MAINTENANCE_STATUS, MAINTENANCE_PRIORITY } = require('../constants');

class MaintenanceService {
  async raiseRequest(requestData, files, triggeredByUser) {
    const { assetId, description, priority } = requestData;

    // 1. Verify Asset
    const asset = await AssetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found.');
    }

    if (['Retired', 'Disposed'].includes(asset.status)) {
      throw new BadRequestError(`Cannot raise maintenance for a ${asset.status} asset.`);
    }

    // Check if there is already an active/pending maintenance request
    const activeMaint = await MaintenanceRequestRepository.findActiveRequestForAsset(assetId);
    if (activeMaint) {
      throw new BadRequestError('An active maintenance ticket already exists for this asset.');
    }

    // Process image uploads
    const imageUrls = [];
    if (files && files.images) {
      for (const file of files.images) {
        const result = await uploadToCloudinary(file.path, 'maintenance');
        imageUrls.push(result.url);
      }
    }

    // 2. Create Request
    const request = await MaintenanceRequestRepository.create({
      assetId,
      reportedById: triggeredByUser._id,
      description,
      priority: priority || MAINTENANCE_PRIORITY.MEDIUM,
      status: MAINTENANCE_STATUS.PENDING_APPROVAL,
      images: imageUrls,
      createdBy: triggeredByUser._id,
    });

    // 3. Create Maintenance Log
    await MaintenanceLogRepository.create({
      requestId: request._id,
      assetId,
      actionPerformed: 'TICKET_CREATED',
      performedById: triggeredByUser._id,
      remarks: 'Maintenance ticket successfully raised.',
    });

    appEventEmitter.emit('maintenance.requested', {
      request,
      asset,
      user: triggeredByUser,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return request;
  }

  async approveRequest(id, approveData, triggeredByUser) {
    const { assignedTechnicianId, estimatedCost, priority } = approveData;

    const result = await runInTransaction(async (session) => {
      const request = await MaintenanceRequestRepository.findById(id, { session });
      if (!request || request.status !== MAINTENANCE_STATUS.PENDING_APPROVAL) {
        throw new NotFoundError('Pending maintenance request not found.');
      }

      // Verify technician
      const technician = await UserRepository.findById(assignedTechnicianId, { session });
      if (!technician || !technician.isActive) {
        throw new BadRequestError('Assigned technician is invalid or inactive.');
      }

      const asset = await AssetRepository.findById(request.assetId, { session });

      // Business Rule: Update asset status to UnderMaintenance
      asset.status = ASSET_STATES.UNDER_MAINTENANCE;
      await asset.save({ session });

      // Update Request
      request.status = MAINTENANCE_STATUS.APPROVED;
      request.assignedTechnicianId = assignedTechnicianId;
      request.estimatedCost = estimatedCost || 0;
      if (priority) request.priority = priority;
      request.approvedById = triggeredByUser._id;
      request.updatedBy = triggeredByUser._id;
      await request.save({ session });

      // Add Log
      await MaintenanceLogRepository.create({
        requestId: request._id,
        assetId: request.assetId,
        actionPerformed: 'TICKET_APPROVED',
        performedById: triggeredByUser._id,
        remarks: `Ticket approved. Assigned to technician ${technician.name}. Estimated cost: $${estimatedCost}`,
      }, session);

      return { request, asset, technician };
    });

    appEventEmitter.emit('maintenance.approved', {
      request: result.request,
      asset: result.asset,
      technician: result.technician,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return result.request;
  }

  async startWork(id, triggeredByUser) {
    const request = await MaintenanceRequestRepository.findById(id);
    if (!request || request.status !== MAINTENANCE_STATUS.APPROVED) {
      throw new NotFoundError('Approved maintenance request not found.');
    }

    // Ensure only the assigned technician (or admin) can start work
    if (request.assignedTechnicianId.toString() !== triggeredByUser._id.toString() && triggeredByUser.roleId.name !== 'Admin') {
      throw new ForbiddenError('You are not the technician assigned to this ticket.');
    }

    request.status = MAINTENANCE_STATUS.IN_PROGRESS;
    request.updatedBy = triggeredByUser._id;
    await request.save();

    await MaintenanceLogRepository.create({
      requestId: request._id,
      assetId: request.assetId,
      actionPerformed: 'WORK_STARTED',
      performedById: triggeredByUser._id,
      remarks: 'Technician has commenced repair work.',
    });

    return request;
  }

  async resolveRequest(id, resolveData, triggeredByUser) {
    const { actualCost, remarks } = resolveData;

    const result = await runInTransaction(async (session) => {
      const request = await MaintenanceRequestRepository.findById(id, { session });
      if (!request || request.status !== MAINTENANCE_STATUS.IN_PROGRESS) {
        throw new NotFoundError('In-progress maintenance request not found.');
      }

      // Verify technician context
      if (request.assignedTechnicianId.toString() !== triggeredByUser._id.toString() && triggeredByUser.roleId.name !== 'Admin') {
        throw new ForbiddenError('You are not the technician assigned to this ticket.');
      }

      const asset = await AssetRepository.findById(request.assetId, { session });

      // Business Rule: Update asset status back to Available
      asset.status = ASSET_STATES.AVAILABLE;
      // Clear current holder since it was returned and serviced
      asset.currentHolderId = null;
      await asset.save({ session });

      // Update Request
      request.status = MAINTENANCE_STATUS.RESOLVED;
      request.actualCost = actualCost || 0;
      request.updatedBy = triggeredByUser._id;
      await request.save({ session });

      // Log resolution
      await MaintenanceLogRepository.create({
        requestId: request._id,
        assetId: request.assetId,
        actionPerformed: 'TICKET_RESOLVED',
        performedById: triggeredByUser._id,
        remarks: remarks || 'Repair work completed successfully.',
      }, session);

      const reporter = await UserRepository.findById(request.reportedById, { session });

      return { request, asset, reporter };
    });

    appEventEmitter.emit('maintenance.resolved', {
      request: result.request,
      asset: result.asset,
      user: result.reporter,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return result.request;
  }

  async getLogs(requestId) {
    return await MaintenanceLogRepository.findByRequestId(requestId);
  }
}

module.exports = new MaintenanceService();
