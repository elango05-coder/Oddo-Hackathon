const ROLES = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'Asset Manager',
  DEPARTMENT_HEAD: 'Department Head',
  EMPLOYEE: 'Employee',
};

const ASSET_STATES = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  RESERVED: 'Reserved',
  UNDER_MAINTENANCE: 'UnderMaintenance',
  LOST: 'Lost',
  RETIRED: 'Retired',
  DISPOSED: 'Disposed',
};

const TRANSFER_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const BOOKING_STATUS = {
  UPCOMING: 'Upcoming',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const MAINTENANCE_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const MAINTENANCE_STATUS = {
  PENDING_APPROVAL: 'PendingApproval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'InProgress',
  RESOLVED: 'Resolved',
};

const AUDIT_CYCLE_STATUS = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  LOCKED: 'Locked',
};

const AUDIT_ITEM_STATUS = {
  VERIFIED: 'Verified',
  MISSING: 'Missing',
  DAMAGED: 'Damaged',
};

const PERMISSIONS = {
  // Users & Roles
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  USER_PROMOTE: 'user:promote',
  
  // Departments
  DEPT_READ: 'dept:read',
  DEPT_WRITE: 'dept:write',
  DEPT_DELETE: 'dept:delete',

  // Categories
  CAT_READ: 'cat:read',
  CAT_WRITE: 'cat:write',
  CAT_DELETE: 'cat:delete',

  // Assets
  ASSET_READ: 'asset:read',
  ASSET_WRITE: 'asset:write',
  ASSET_DELETE: 'asset:delete',

  // Allocations & Transfers
  ALLOC_READ: 'alloc:read',
  ALLOC_WRITE: 'alloc:write',
  ALLOC_APPROVE: 'alloc:approve',
  TRANSFER_READ: 'transfer:read',
  TRANSFER_WRITE: 'transfer:write',
  TRANSFER_APPROVE: 'transfer:approve',

  // Bookings
  BOOKING_READ: 'booking:read',
  BOOKING_WRITE: 'booking:write',
  BOOKING_DELETE: 'booking:delete',

  // Maintenance
  MAINT_READ: 'maint:read',
  MAINT_WRITE: 'maint:write',
  MAINT_APPROVE: 'maint:approve',
  MAINT_RESOLVE: 'maint:resolve',

  // Audits
  AUDIT_READ: 'audit:read',
  AUDIT_WRITE: 'audit:write',
  AUDIT_VERIFY: 'audit:verify',
  AUDIT_CLOSE: 'audit:close',

  // Reports & Dashboards
  REPORT_READ: 'report:read',
  DASHBOARD_READ: 'dashboard:read',
};

const CENTRAL_PERMISSION_MATRIX = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin has all permissions
  
  [ROLES.ASSET_MANAGER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.DEPT_READ,
    PERMISSIONS.CAT_READ,
    PERMISSIONS.CAT_WRITE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_WRITE,
    PERMISSIONS.ALLOC_READ,
    PERMISSIONS.ALLOC_WRITE,
    PERMISSIONS.ALLOC_APPROVE,
    PERMISSIONS.TRANSFER_READ,
    PERMISSIONS.TRANSFER_APPROVE,
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.MAINT_READ,
    PERMISSIONS.MAINT_WRITE,
    PERMISSIONS.MAINT_APPROVE,
    PERMISSIONS.MAINT_RESOLVE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_WRITE,
    PERMISSIONS.AUDIT_VERIFY,
    PERMISSIONS.AUDIT_CLOSE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.DASHBOARD_READ,
  ],
  
  [ROLES.DEPARTMENT_HEAD]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.DEPT_READ,
    PERMISSIONS.CAT_READ,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ALLOC_READ,
    PERMISSIONS.ALLOC_WRITE,
    PERMISSIONS.ALLOC_APPROVE, // For their department only (handled in services)
    PERMISSIONS.TRANSFER_READ,
    PERMISSIONS.TRANSFER_WRITE,
    PERMISSIONS.TRANSFER_APPROVE, // For department
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_WRITE,
    PERMISSIONS.MAINT_READ,
    PERMISSIONS.MAINT_WRITE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.DASHBOARD_READ,
  ],
  
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.DEPT_READ,
    PERMISSIONS.CAT_READ,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ALLOC_READ,
    PERMISSIONS.ALLOC_WRITE, // Can request allocation
    PERMISSIONS.TRANSFER_READ,
    PERMISSIONS.TRANSFER_WRITE, // Can request transfer
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_WRITE,
    PERMISSIONS.MAINT_READ,
    PERMISSIONS.MAINT_WRITE, // Can raise maintenance requests for assets they hold
  ],
};

module.exports = {
  ROLES,
  ASSET_STATES,
  TRANSFER_STATUS,
  BOOKING_STATUS,
  MAINTENANCE_PRIORITY,
  MAINTENANCE_STATUS,
  AUDIT_CYCLE_STATUS,
  AUDIT_ITEM_STATUS,
  PERMISSIONS,
  CENTRAL_PERMISSION_MATRIX,
};
