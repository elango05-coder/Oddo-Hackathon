export interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  roleId: Role | string;
  departmentId?: Department | string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  parentId?: Department | string | null;
  headId?: User | string | null;
  createdAt: string;
}

export interface MetadataField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  required: boolean;
}

export interface AssetCategory {
  _id: string;
  name: string;
  code: string;
  description?: string;
  fields: MetadataField[];
  createdAt: string;
}

export interface Asset {
  _id: string;
  name: string;
  tag: string;
  categoryId: AssetCategory | string;
  departmentId?: Department | string | null;
  status: 'Available' | 'Allocated' | 'UnderMaintenance' | 'Lost';
  serialNumber?: string;
  purchaseDate: string;
  purchaseCost: number;
  lifecycleStage: string;
  qrCodeUrl?: string;
  imageUrl?: string;
  documents?: string[];
  metadata: Record<string, any>;
  currentHolderId?: User | string | null;
  createdAt: string;
}

export interface AssetAllocation {
  _id: string;
  assetId: Asset | string;
  assigneeId: User | string;
  allocatedById: User | string;
  expectedReturnDate: string;
  actualReturnDate?: string | null;
  conditionOnAllocation: string;
  conditionOnReturn?: string | null;
  status: 'Active' | 'Returned' | 'Overdue';
  transferHistory: string[];
  createdAt: string;
}

export interface TransferRequest {
  _id: string;
  assetId: Asset | string;
  fromUserId: User | string;
  toUserId: User | string;
  requestedById: User | string;
  approvedById?: User | string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  approvedAt?: string | null;
  createdAt: string;
}

export interface ResourceBooking {
  _id: string;
  resourceId: Asset | string;
  userId: User | string;
  startDate: string;
  endDate: string;
  purpose: string;
  status: 'Active' | 'Cancelled';
  createdAt: string;
}

export interface MaintenanceRequest {
  _id: string;
  assetId: Asset | string;
  reportedById: User | string;
  assignedTechnicianId?: User | string | null;
  status: 'PendingApproval' | 'Approved' | 'Rejected' | 'InProgress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  estimatedCost: number;
  actualCost: number;
  createdAt: string;
}

export interface MaintenanceLog {
  _id: string;
  requestId: string;
  assetId: string;
  actionPerformed: string;
  performedById: User | string;
  remarks?: string;
  createdAt: string;
}

export interface AuditCycle {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Locked';
  assignedAuditors: (User | string)[];
  createdAt: string;
}

export interface AuditItem {
  _id: string;
  cycleId: string;
  assetId: Asset | string;
  auditorId: User | string;
  status: 'Verified' | 'Damaged' | 'Missing';
  notes?: string;
  verifiedAt: string;
}

export interface ActivityLog {
  _id: string;
  userId: User | string;
  action: string;
  collectionName: string;
  recordId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
