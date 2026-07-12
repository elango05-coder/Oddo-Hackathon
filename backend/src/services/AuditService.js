const mongoose = require('mongoose');
const AuditCycleRepository = require('../repositories/AuditCycleRepository');
const AuditItemRepository = require('../repositories/AuditItemRepository');
const AssetRepository = require('../repositories/AssetRepository');
const UserRepository = require('../repositories/UserRepository');
const appEventEmitter = require('../events/eventEmitter');
const { runInTransaction } = require('../helpers/transaction');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { ASSET_STATES, AUDIT_CYCLE_STATUS, AUDIT_ITEM_STATUS } = require('../constants');

class AuditService {
  async createCycle(cycleData, triggeredByUser) {
    const { name, startDate, endDate, assignedAuditors } = cycleData;

    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestError('Start date must be before end date.');
    }

    // Verify auditors
    for (const auditorId of assignedAuditors) {
      const auditor = await UserRepository.findById(auditorId);
      if (!auditor || !auditor.isActive) {
        throw new BadRequestError(`Assigned auditor ID '${auditorId}' is invalid or inactive.`);
      }
    }

    const cycle = await AuditCycleRepository.create({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: AUDIT_CYCLE_STATUS.SCHEDULED,
      assignedAuditors,
      createdBy: triggeredByUser._id,
    });

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'CREATE_AUDIT_CYCLE',
      collectionName: 'AuditCycles',
      recordId: cycle._id,
      newValue: cycle,
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return cycle;
  }

  async startCycle(id, triggeredByUser) {
    const cycle = await AuditCycleRepository.findById(id);
    if (!cycle) {
      throw new NotFoundError('Audit cycle not found.');
    }

    if (cycle.status !== AUDIT_CYCLE_STATUS.SCHEDULED) {
      throw new BadRequestError(`Cannot start audit cycle. Current status is ${cycle.status}.`);
    }

    cycle.status = AUDIT_CYCLE_STATUS.IN_PROGRESS;
    cycle.updatedBy = triggeredByUser._id;
    await cycle.save();

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'START_AUDIT_CYCLE',
      collectionName: 'AuditCycles',
      recordId: id,
      newValue: { status: AUDIT_CYCLE_STATUS.IN_PROGRESS },
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return cycle;
  }

  async verifyAsset(verifyData, triggeredByUser) {
    const { cycleId, assetId, status, notes } = verifyData;

    return await runInTransaction(async (session) => {
      // 1. Verify Cycle is Active and not locked
      const cycle = await AuditCycleRepository.findById(cycleId, { session });
      if (!cycle) {
        throw new NotFoundError('Audit cycle not found.');
      }

      if (cycle.status !== AUDIT_CYCLE_STATUS.IN_PROGRESS) {
        throw new BadRequestError(`Audit cycle is not in progress. Current status is ${cycle.status}.`);
      }

      // 2. Business Rule: Auditor must be assigned (or Admin/Asset Manager)
      const isAuditor = cycle.assignedAuditors.some((id) => id.toString() === triggeredByUser._id.toString());
      const isManagerOrAdmin = ['Admin', 'Asset Manager'].includes(triggeredByUser.roleId.name);
      
      if (!isAuditor && !isManagerOrAdmin) {
        throw new ForbiddenError('You are not authorized as an auditor for this cycle.');
      }

      // 3. Verify Asset
      const asset = await AssetRepository.findById(assetId, { session });
      if (!asset) {
        throw new NotFoundError('Asset to verify not found.');
      }

      // 4. Update asset status if Missing (Lost)
      if (status === AUDIT_ITEM_STATUS.MISSING) {
        asset.status = ASSET_STATES.LOST;
        await asset.save({ session });
      }

      // 5. Upsert AuditItem (prevent double auditing the same asset in one cycle)
      let auditItem = await AuditItemRepository.findOne({ cycleId, assetId }, { session });
      if (auditItem) {
        auditItem.status = status;
        auditItem.notes = notes || '';
        auditItem.auditorId = triggeredByUser._id;
        auditItem.updatedBy = triggeredByUser._id;
        await auditItem.save({ session });
      } else {
        auditItem = await AuditItemRepository.create({
          cycleId,
          assetId,
          auditorId: triggeredByUser._id,
          status,
          notes: notes || '',
          verifiedAt: new Date(),
          createdBy: triggeredByUser._id,
        }, session);
      }

      return auditItem;
    });
  }

  async generateDiscrepancyReport(cycleId) {
    const cycle = await AuditCycleRepository.findById(cycleId);
    if (!cycle) {
      throw new NotFoundError('Audit cycle not found.');
    }

    // Get all registered assets (excluding disposed/retired)
    const allAssets = await AssetRepository.find({ status: { $nin: ['Retired', 'Disposed'] } });
    
    // Get all audited items in this cycle
    const auditedItems = await AuditItemRepository.findItemsByCycle(cycleId);
    const auditedAssetIds = new Set(auditedItems.map((item) => item.assetId.toString()));

    const discrepancies = {
      unverified: [], // Registered but not audited
      missing: [],     // Audited as missing
      damaged: [],     // Audited as damaged
    };

    allAssets.forEach((asset) => {
      if (!auditedAssetIds.has(asset._id.toString())) {
        discrepancies.unverified.push(asset);
      }
    });

    auditedItems.forEach((item) => {
      if (item.status === AUDIT_ITEM_STATUS.MISSING) {
        discrepancies.missing.push(item);
      } else if (item.status === AUDIT_ITEM_STATUS.DAMAGED) {
        discrepancies.damaged.push(item);
      }
    });

    return {
      cycleName: cycle.name,
      status: cycle.status,
      totalAssetsCount: allAssets.length,
      verifiedCount: auditedItems.length,
      discrepancies,
    };
  }

  async closeCycle(id, triggeredByUser) {
    const cycle = await AuditCycleRepository.findById(id);
    if (!cycle) {
      throw new NotFoundError('Audit cycle not found.');
    }

    if (cycle.status !== AUDIT_CYCLE_STATUS.IN_PROGRESS) {
      throw new BadRequestError(`Cannot close audit cycle. Current status is ${cycle.status}.`);
    }

    const report = await this.generateDiscrepancyReport(id);
    const discrepanciesCount = report.discrepancies.unverified.length + 
                               report.discrepancies.missing.length + 
                               report.discrepancies.damaged.length;

    cycle.status = AUDIT_CYCLE_STATUS.COMPLETED;
    cycle.completedAt = new Date();
    cycle.updatedBy = triggeredByUser._id;
    await cycle.save();

    appEventEmitter.emit('audit.completed', {
      cycle,
      auditor: triggeredByUser,
      discrepanciesCount,
    });

    return cycle;
  }

  async lockCycle(id, triggeredByUser) {
    const cycle = await AuditCycleRepository.findById(id);
    if (!cycle) {
      throw new NotFoundError('Audit cycle not found.');
    }

    if (cycle.status !== AUDIT_CYCLE_STATUS.COMPLETED) {
      throw new BadRequestError('Only completed audit cycles can be locked.');
    }

    cycle.status = AUDIT_CYCLE_STATUS.LOCKED;
    cycle.updatedBy = triggeredByUser._id;
    await cycle.save();

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'LOCK_AUDIT_CYCLE',
      collectionName: 'AuditCycles',
      recordId: id,
      newValue: { status: AUDIT_CYCLE_STATUS.LOCKED },
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return cycle;
  }
}

module.exports = new AuditService();
