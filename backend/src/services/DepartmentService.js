const DepartmentRepository = require('../repositories/DepartmentRepository');
const UserRepository = require('../repositories/UserRepository');
const RoleRepository = require('../repositories/RoleRepository');
const AssetRepository = require('../repositories/AssetRepository');
const appEventEmitter = require('../events/eventEmitter');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { ROLES } = require('../constants');

class DepartmentService {
  async createDepartment(deptData, triggeredByUser) {
    const { name, code, parentId, headId } = deptData;

    // Check code uniqueness
    const existingCode = await DepartmentRepository.findByCode(code);
    if (existingCode) {
      throw new BadRequestError(`Department code '${code}' is already registered.`);
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await DepartmentRepository.findById(parentId);
      if (!parent || !parent.isActive) {
        throw new BadRequestError('Specified parent department is invalid or inactive.');
      }
    }

    // Validate head user if provided
    let headUser = null;
    if (headId) {
      headUser = await UserRepository.findById(headId);
      if (!headUser || !headUser.isActive) {
        throw new BadRequestError('Specified department head user is invalid or inactive.');
      }
    }

    const dept = await DepartmentRepository.create({
      name,
      code,
      parentId: parentId || null,
      headId: headId || null,
      isActive: true,
      createdBy: triggeredByUser._id,
    });

    // If headId is provided, promote user to Department Head role
    if (headId && headUser) {
      await this._promoteToDeptHead(headUser, triggeredByUser);
    }

    // Activity logging
    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'CREATE_DEPARTMENT',
      collectionName: 'Departments',
      recordId: dept._id,
      newValue: dept,
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return dept;
  }

  async updateDepartment(id, updateData, triggeredByUser) {
    const dept = await DepartmentRepository.findById(id);
    if (!dept) {
      throw new NotFoundError('Department not found.');
    }

    // Prevent circular hierarchy
    if (updateData.parentId) {
      if (updateData.parentId.toString() === id.toString()) {
        throw new BadRequestError('A department cannot be its own parent.');
      }
      
      // Traverse parent tree to ensure no loop
      let parentId = updateData.parentId;
      while (parentId) {
        const parent = await DepartmentRepository.findById(parentId);
        if (!parent) break;
        if (parent._id.toString() === id.toString()) {
          throw new BadRequestError('Circular hierarchy detected. Parent cannot be a sub-department.');
        }
        parentId = parent.parentId;
      }
    }

    // Validate new head user
    if (updateData.headId && updateData.headId.toString() !== (dept.headId ? dept.headId.toString() : '')) {
      const headUser = await UserRepository.findById(updateData.headId);
      if (!headUser || !headUser.isActive) {
        throw new BadRequestError('Specified department head user is invalid or inactive.');
      }
      await this._promoteToDeptHead(headUser, triggeredByUser);
    }

    const oldDept = JSON.parse(JSON.stringify(dept));
    
    updateData.updatedBy = triggeredByUser._id;
    const updatedDept = await DepartmentRepository.updateById(id, updateData);

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'UPDATE_DEPARTMENT',
      collectionName: 'Departments',
      recordId: id,
      oldValue: oldDept,
      newValue: updatedDept,
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return updatedDept;
  }

  async getDepartmentHierarchy() {
    const departments = await DepartmentRepository.find({ isActive: true });
    
    // Build tree
    const map = {};
    const roots = [];
    
    departments.forEach((dept) => {
      map[dept._id] = { ...dept.toObject(), children: [] };
    });
    
    departments.forEach((dept) => {
      if (dept.parentId && map[dept.parentId]) {
        map[dept.parentId].children.push(map[dept._id]);
      } else {
        roots.push(map[dept._id]);
      }
    });

    return roots;
  }

  async deactivateDepartment(id, triggeredByUser) {
    const dept = await DepartmentRepository.findById(id);
    if (!dept) {
      throw new NotFoundError('Department not found.');
    }

    // Enforce check: any active assets in this department?
    const activeAssetsCount = await AssetRepository.count({ departmentId: id, status: { $ne: 'Disposed' } });
    if (activeAssetsCount > 0) {
      throw new BadRequestError(`Cannot deactivate department. It has ${activeAssetsCount} active assets registered.`);
    }

    // Cascadingly deactivate subdepartments
    await this._deactivateSubdepartments(id, triggeredByUser);

    dept.isActive = false;
    dept.updatedBy = triggeredByUser._id;
    await dept.save();

    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'DEACTIVATE_DEPARTMENT',
      collectionName: 'Departments',
      recordId: id,
      newValue: { isActive: false },
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return dept;
  }

  // Helper: promote user to Department Head role
  async _promoteToDeptHead(user, triggeredByUser) {
    const deptHeadRole = await RoleRepository.findByName(ROLES.DEPARTMENT_HEAD);
    if (!deptHeadRole) return;
    
    // Skip if already Department Head or Admin
    const populatedUser = await UserRepository.findById(user._id, { populate: 'roleId' });
    if (populatedUser.roleId.name === ROLES.DEPARTMENT_HEAD || populatedUser.roleId.name === ROLES.ADMIN) {
      return;
    }

    const oldRoleName = populatedUser.roleId.name;
    populatedUser.roleId = deptHeadRole._id;
    await populatedUser.save();

    appEventEmitter.emit('user.promoted', {
      targetUser: populatedUser,
      oldRoleName,
      newRoleName: ROLES.DEPARTMENT_HEAD,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });
  }

  // Recursive subdepartment deactivation helper
  async _deactivateSubdepartments(parentId, triggeredByUser) {
    const subs = await DepartmentRepository.find({ parentId });
    for (const sub of subs) {
      const activeAssets = await AssetRepository.count({ departmentId: sub._id, status: { $ne: 'Disposed' } });
      if (activeAssets > 0) {
        throw new BadRequestError(`Cannot deactivate sub-department ${sub.name}. It contains active assets.`);
      }

      await this._deactivateSubdepartments(sub._id, triggeredByUser);
      
      sub.isActive = false;
      sub.updatedBy = triggeredByUser._id;
      await sub.save();

      appEventEmitter.emit('activity.log', {
        userId: triggeredByUser._id,
        action: 'DEACTIVATE_DEPARTMENT',
        collectionName: 'Departments',
        recordId: sub._id,
        newValue: { isActive: false },
        ipAddress: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      });
    }
  }
}

module.exports = new DepartmentService();
