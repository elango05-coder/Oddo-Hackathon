const mongoose = require('mongoose');
const AssetAllocationRepository = require('../repositories/AssetAllocationRepository');
const AssetRepository = require('../repositories/AssetRepository');
const UserRepository = require('../repositories/UserRepository');
const TransferRequestRepository = require('../repositories/TransferRequestRepository');
const appEventEmitter = require('../events/eventEmitter');
const { runInTransaction } = require('../helpers/transaction');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { ASSET_STATES, TRANSFER_STATUS, ROLES } = require('../constants');

class AllocationService {
  async allocateAsset(allocationData, triggeredByUser) {
    const { assetId, assigneeId, expectedReturnDate, conditionOnAllocation } = allocationData;

    const result = await runInTransaction(async (session) => {
      // 1. Verify assignee exists
      const assignee = await UserRepository.findById(assigneeId, { session });
      if (!assignee || !assignee.isActive) {
        throw new BadRequestError('Assignee employee is invalid or deactivated.');
      }

      // 2. Expected return date check
      if (new Date(expectedReturnDate) <= new Date()) {
        throw new BadRequestError('Expected return date must be a future date.');
      }

      // 3. ATOMIC Check-and-set asset status using findOneAndUpdate to prevent race conditions
      const Asset = require('../models/Asset');
      const asset = await Asset.findOneAndUpdate(
        { _id: assetId, status: ASSET_STATES.AVAILABLE, isDeleted: { $ne: true } },
        { status: ASSET_STATES.ALLOCATED, currentHolderId: assigneeId },
        { session, new: true }
      ).exec();

      if (!asset) {
        const exists = await AssetRepository.findById(assetId, { session });
        if (!exists) {
          throw new NotFoundError('Asset not found.');
        }
        throw new BadRequestError(`Asset is not available for checkout. Current status: ${exists.status}`);
      }

      // 4. Create allocation record
      const allocation = await AssetAllocationRepository.create({
        assetId,
        assigneeId,
        allocatedById: triggeredByUser._id,
        expectedReturnDate: new Date(expectedReturnDate),
        conditionOnAllocation,
        status: 'Active',
        createdBy: triggeredByUser._id,
      }, session);

      return { allocation, asset, assignee };
    });

    // Trigger event after commit
    appEventEmitter.emit('allocation.created', {
      allocation: result.allocation,
      asset: result.asset,
      user: result.assignee,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return result.allocation;
  }

  async requestTransfer(transferData, triggeredByUser) {
    const { assetId, toUserId, reason } = transferData;

    const asset = await AssetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found.');
    }

    // Must be currently allocated to the requester
    const activeAllocation = await AssetAllocationRepository.findActiveAllocation(assetId);
    if (!activeAllocation || activeAllocation.assigneeId.toString() !== triggeredByUser._id.toString()) {
      throw new BadRequestError('You can only transfer assets currently allocated to you.');
    }

    // Check target user
    const recipient = await UserRepository.findById(toUserId);
    if (!recipient || !recipient.isActive) {
      throw new BadRequestError('Recipient employee is invalid or inactive.');
    }

    if (toUserId.toString() === triggeredByUser._id.toString()) {
      throw new BadRequestError('You cannot transfer an asset to yourself.');
    }

    // Check if there is already a pending transfer request for this asset
    const pendingRequest = await TransferRequestRepository.findPendingRequestForAsset(assetId);
    if (pendingRequest) {
      throw new BadRequestError('A pending transfer request already exists for this asset.');
    }

    const request = await TransferRequestRepository.create({
      assetId,
      fromUserId: triggeredByUser._id,
      toUserId,
      requestedById: triggeredByUser._id,
      status: TRANSFER_STATUS.PENDING,
      reason,
      createdBy: triggeredByUser._id,
    });

    appEventEmitter.emit('transfer.requested', {
      request,
      asset,
      fromUser: triggeredByUser,
      toUser: recipient,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return request;
  }

  async approveTransfer(requestId, triggeredByUser) {
    const result = await runInTransaction(async (session) => {
      const request = await TransferRequestRepository.findById(requestId, { session });
      if (!request || request.status !== TRANSFER_STATUS.PENDING) {
        throw new NotFoundError('Pending transfer request not found.');
      }

      // 1. Business Rule: Cannot approve own request
      if (request.fromUserId.toString() === triggeredByUser._id.toString()) {
        throw new ForbiddenError('You cannot approve your own transfer request.');
      }

      // 2. Business Rule: Department Head can only approve department requests
      if (triggeredByUser.roleId.name === ROLES.DEPARTMENT_HEAD) {
        const requester = await UserRepository.findById(request.fromUserId, { session });
        if (requester.departmentId.toString() !== triggeredByUser.departmentId.toString()) {
          throw new ForbiddenError('Department Heads can only approve transfer requests within their own department.');
        }
      } else if (triggeredByUser.roleId.name !== ROLES.ADMIN && triggeredByUser.roleId.name !== ROLES.ASSET_MANAGER) {
        throw new ForbiddenError('You do not have permission to approve asset transfers.');
      }

      const asset = await AssetRepository.findById(request.assetId, { session });
      const currentAllocation = await AssetAllocationRepository.findOne({ assetId: request.assetId, status: 'Active' }, { session });
      const fromUser = await UserRepository.findById(request.fromUserId, { session });
      const toUser = await UserRepository.findById(request.toUserId, { session });

      if (!currentAllocation) {
        throw new BadRequestError('No active allocation exists for this asset transfer.');
      }

      // Update active allocation to Returned via Transferred status
      currentAllocation.actualReturnDate = new Date();
      currentAllocation.status = 'Returned';
      currentAllocation.conditionOnReturn = 'Transferred';
      await currentAllocation.save({ session });

      // Create a new allocation record for recipient
      await AssetAllocationRepository.create({
        assetId: request.assetId,
        assigneeId: request.toUserId,
        allocatedById: triggeredByUser._id,
        expectedReturnDate: currentAllocation.expectedReturnDate, // inherit original return date
        conditionOnAllocation: currentAllocation.conditionOnAllocation,
        status: 'Active',
        transferHistory: [...(currentAllocation.transferHistory || []), request._id],
        createdBy: triggeredByUser._id,
      }, session);

      // Update asset current holder
      asset.currentHolderId = request.toUserId;
      await asset.save({ session });

      // Update request status
      request.status = TRANSFER_STATUS.APPROVED;
      request.approvedById = triggeredByUser._id;
      request.approvedAt = new Date();
      await request.save({ session });

      return { request, asset, fromUser, toUser };
    });

    appEventEmitter.emit('transfer.approved', {
      request: result.request,
      asset: result.asset,
      fromUser: result.fromUser,
      toUser: result.toUser,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return result.request;
  }

  async rejectTransfer(requestId, triggeredByUser) {
    const request = await TransferRequestRepository.findById(requestId);
    if (!request || request.status !== TRANSFER_STATUS.PENDING) {
      throw new NotFoundError('Pending transfer request not found.');
    }

    // Department Head scoping
    if (triggeredByUser.roleId.name === ROLES.DEPARTMENT_HEAD) {
      const requester = await UserRepository.findById(request.fromUserId);
      if (requester.departmentId.toString() !== triggeredByUser.departmentId.toString()) {
        throw new ForbiddenError('Department Heads can only reject transfer requests within their own department.');
      }
    } else if (triggeredByUser.roleId.name !== ROLES.ADMIN && triggeredByUser.roleId.name !== ROLES.ASSET_MANAGER) {
      throw new ForbiddenError('You do not have permission to reject asset transfers.');
    }

    const asset = await AssetRepository.findById(request.assetId);
    const fromUser = await UserRepository.findById(request.fromUserId);

    request.status = TRANSFER_STATUS.REJECTED;
    request.updatedBy = triggeredByUser._id;
    await request.save();

    appEventEmitter.emit('transfer.rejected', {
      request,
      asset,
      fromUser,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return request;
  }

  async returnAsset(returnDetails, triggeredByUser) {
    const { assetId, conditionOnReturn } = returnDetails;

    const result = await runInTransaction(async (session) => {
      const asset = await AssetRepository.findById(assetId, { session });
      if (!asset) {
        throw new NotFoundError('Asset not found.');
      }

      const activeAllocation = await AssetAllocationRepository.findOne({ assetId, status: 'Active' }, { session });
      if (!activeAllocation) {
        throw new BadRequestError('No active allocation record exists for this asset.');
      }

      const assignee = await UserRepository.findById(activeAllocation.assigneeId, { session });

      // Update allocation record
      activeAllocation.actualReturnDate = new Date();
      activeAllocation.status = 'Returned';
      activeAllocation.conditionOnReturn = conditionOnReturn;
      activeAllocation.updatedBy = triggeredByUser._id;
      await activeAllocation.save({ session });

      // Reset asset holder and status
      asset.status = ASSET_STATES.AVAILABLE;
      asset.currentHolderId = null;
      await asset.save({ session });

      return { activeAllocation, asset, assignee };
    });

    // Trigger event after commit
    appEventEmitter.emit('allocation.returned', {
      allocation: result.activeAllocation,
      asset: result.asset,
      user: result.assignee,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return result.activeAllocation;
  }

  // Scheduler midnight cron runner
  async processOverdueAllocations() {
    const overdueList = await AssetAllocationRepository.findOverdueAllocations();
    
    for (const alloc of overdueList) {
      alloc.status = 'Overdue';
      await alloc.save();

      const user = await UserRepository.findById(alloc.assigneeId);
      const asset = await AssetRepository.findById(alloc.assetId);
      
      if (user && asset) {
        const notificationDispatcher = require('../notifications/notificationDispatcher');
        await notificationDispatcher.send({
          userId: user._id,
          title: 'Asset Overdue Alert',
          message: `The asset '${asset.name}' (${asset.tag}) was expected to be returned on ${new Date(alloc.expectedReturnDate).toDateString()}. Please check it in immediately.`,
          sendEmail: true,
          emailTo: user.email,
          emailSubject: 'AssetFlow - OVERDUE ASSET NOTICE',
        });
      }
    }
  }
}

module.exports = new AllocationService();
