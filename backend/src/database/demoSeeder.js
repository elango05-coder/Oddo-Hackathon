const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const AssetCategory = require('../models/AssetCategory');
const Asset = require('../models/Asset');
const AssetAllocation = require('../models/AssetAllocation');
const Booking = require('../models/Booking');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const AuditCycle = require('../models/AuditCycle');
const AuditItem = require('../models/AuditItem');
const ActivityLog = require('../models/ActivityLog');
const DashboardCache = require('../models/DashboardCache');
const { generateQRCodeUrl } = require('../helpers/qrCode');
const {
  ASSET_STATES,
  BOOKING_STATUS,
  MAINTENANCE_STATUS,
  AUDIT_CYCLE_STATUS,
  AUDIT_ITEM_STATUS,
  ROLES
} = require('../constants');
const logger = require('../config/logger');

// Pre-hashed bcrypt password for 'password123' to make seeding run in milliseconds instead of 20 seconds
const PRE_HASHED_PASSWORD = '$2a$12$uyo27oexLtfAL1hCRydqqutQ2AQ7U3.bGZHIEXZY7AWVuzL46WZbW';

const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Ruby', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xander', 'Yara', 'Zack', 'William', 'James', 'Michael', 'Robert', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const departmentsInfo = [
  { name: 'Information Technology', code: 'IT' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'Finance & Accounting', code: 'FIN' },
  { name: 'Corporate Operations', code: 'OPS' },
  { name: 'Sales & Marketing', code: 'SLS' },
  { name: 'Legal & Compliance', code: 'LEG' },
  { name: 'Information Security', code: 'SEC' },
  { name: 'Research & Development', code: 'RD' },
  { name: 'Facilities & Real Estate', code: 'FAC' },
  { name: 'Procurement & Supply Chain', code: 'PROC' },
  { name: 'Executive Suite', code: 'EXEC' },
  { name: 'Customer Success', code: 'CS' },
  { name: 'Quality Assurance', code: 'QA' },
  { name: 'DevOps & Infrastructure', code: 'DEV' },
  { name: 'Product Management', code: 'PROD' },
  { name: 'Creative Design', code: 'DSN' },
  { name: 'Business Intelligence', code: 'BI' },
  { name: 'Training & Enablement', code: 'TRN' },
  { name: 'Public Relations', code: 'PR' },
  { name: 'Administrative Support', code: 'ADM' }
];

const categoryInfo = [
  {
    name: 'Workstations',
    code: 'WKS',
    description: 'Company Desktops and Laptops',
    fields: [
      { name: 'ram_gb', label: 'RAM (GB)', type: 'number', required: true },
      { name: 'storage_gb', label: 'Storage (GB)', type: 'number', required: true },
      { name: 'os', label: 'Operating System', type: 'text', required: true }
    ]
  },
  {
    name: 'Mobile Devices',
    code: 'MOB',
    description: 'Smartphones and Tablets',
    fields: [
      { name: 'screen_size', label: 'Screen Size (in)', type: 'number', required: false },
      { name: 'storage_gb', label: 'Storage (GB)', type: 'number', required: true }
    ]
  },
  {
    name: 'AV Equipment',
    code: 'AV',
    description: 'Meeting Room Monitors and Projectors',
    fields: [
      { name: 'resolution', label: 'Native Resolution', type: 'text', required: false },
      { name: 'wireless', label: 'Supports Wireless Display', type: 'boolean', required: true }
    ]
  },
  {
    name: 'Networking Gear',
    code: 'NET',
    description: 'Corporate Switches, Routers, and Access Points',
    fields: [
      { name: 'ports', label: 'Port Count', type: 'number', required: true },
      { name: 'speed_gbps', label: 'Port Speed (Gbps)', type: 'number', required: false }
    ]
  },
  {
    name: 'Office Furniture',
    code: 'FUR',
    description: 'Desks, Ergonomic Chairs, and Cabinets',
    fields: [
      { name: 'material', label: 'Material Composition', type: 'text', required: false },
      { name: 'adjustable', label: 'Is Height Adjustable', type: 'boolean', required: true }
    ]
  }
];

const assetNames = {
  WKS: ['MacBook Pro 14"', 'MacBook Pro 16"', 'Dell Latitude 5420', 'ThinkPad T14', 'HP EliteBook 840', 'Mac Studio', 'Dell Precision Tower'],
  MOB: ['iPhone 13 Pro', 'iPhone 14 Pro', 'iPad Air 5th Gen', 'Samsung Galaxy S22', 'Google Pixel 6 Pro'],
  AV: ['Conference Room Projector 4K', 'Logitech Rally Bar', 'Samsung 65" TV Display', 'Jabra Speak 510 Speakerphone'],
  NET: ['Cisco Switch 24-Port', 'Ubiquiti UniFi AP Pro', 'Palo Alto Network Firewall Router', 'Netgear Orbi Pro Switch'],
  FUR: ['Ergonomic Task Chair', 'Pneumatic Standing Desk', 'Mobile Pedestal File Cabinet', 'Whiteboard Collaboration Stand']
};

const seedDemoData = async () => {
  try {
    logger.info('🚀 Beginning massive Hackathon seeding process...');

    // 1. Fetch Roles Map
    const roles = await Role.find({});
    const rolesMap = {};
    roles.forEach(r => {
      rolesMap[r.name] = r._id;
    });

    // Fallback if roles aren't seeded yet
    if (!rolesMap[ROLES.ADMIN]) {
      throw new Error('Database Roles have not been seeded yet. Please start backend or run npm run test first.');
    }

    // 2. Clear Existing Collections
    logger.info('🧹 Clearing existing collections (retaining basic roles and current Admin User)...');
    const adminUser = await User.findOne({ email: 'admin@assetflow.com' });
    
    await User.deleteMany({ _id: { $ne: adminUser ? adminUser._id : null } });
    await Department.deleteMany({});
    await AssetCategory.deleteMany({});
    await Asset.deleteMany({});
    await AssetAllocation.deleteMany({});
    await Booking.deleteMany({});
    await MaintenanceRequest.deleteMany({});
    await AuditCycle.deleteMany({});
    await AuditItem.deleteMany({});
    await ActivityLog.deleteMany({});
    await DashboardCache.deleteMany({});

    // 3. Seed Departments (20)
    logger.info('🏢 Seeding 20 Departments...');
    const depts = [];
    for (const d of departmentsInfo) {
      const newDept = new Department({
        name: d.name,
        code: d.code,
        isActive: true
      });
      depts.push(newDept);
    }
    const seededDepts = await Department.insertMany(depts);

    // 4. Seed Employees (200)
    logger.info('👥 Seeding 200 Employees (using pre-hashed password for high speed)...');
    const employees = [];
    
    // Ensure we have 5 Asset Managers, 20 Department Heads (1 per department), and 174 regular Employees
    let managerCount = 0;
    let deptHeadCount = 0;

    for (let i = 1; i <= 200; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${fName} ${lName}`;
      const email = `employee.${i}@assetflow.com`;
      
      let roleId = rolesMap[ROLES.EMPLOYEE];
      let departmentId = seededDepts[Math.floor(Math.random() * seededDepts.length)]._id;

      if (managerCount < 5) {
        roleId = rolesMap[ROLES.ASSET_MANAGER];
        managerCount++;
      } else if (deptHeadCount < 20) {
        roleId = rolesMap[ROLES.DEPARTMENT_HEAD];
        // Assign this department head exactly to their department
        departmentId = seededDepts[deptHeadCount]._id;
        deptHeadCount++;
      }

      employees.push({
        name,
        email,
        password: PRE_HASHED_PASSWORD, // save pre-hashed string
        roleId,
        departmentId,
        isEmailVerified: true,
        isActive: true,
        isDeleted: false
      });
    }

    const seededEmployees = await User.insertMany(employees);

    // Update the headId in Departments to link back to the department heads
    const deptHeads = seededEmployees.filter(emp => emp.roleId.toString() === rolesMap[ROLES.DEPARTMENT_HEAD].toString());
    for (let k = 0; k < seededDepts.length; k++) {
      const dept = seededDepts[k];
      const head = deptHeads.find(h => h.departmentId.toString() === dept._id.toString());
      if (head) {
        await Department.findByIdAndUpdate(dept._id, { headId: head._id });
      }
    }

    // 5. Seed Asset Categories (5)
    logger.info('📂 Seeding 5 Asset Categories with custom metadata schemas...');
    const seededCategories = await AssetCategory.insertMany(categoryInfo);

    // 6. Seed Assets (1000)
    logger.info('💻 Seeding 1000 Assets across categories and departments...');
    const assets = [];
    const creatorId = adminUser ? adminUser._id : seededEmployees[0]._id;

    for (let i = 1; i <= 1000; i++) {
      const category = seededCategories[Math.floor(Math.random() * seededCategories.length)];
      const namesList = assetNames[category.code];
      const name = namesList[Math.floor(Math.random() * namesList.length)];
      const department = seededDepts[Math.floor(Math.random() * seededDepts.length)];

      // Generate Asset tag AST-YYYY-XXXX
      const paddedSeq = String(i).padStart(4, '0');
      const tag = `AST-2026-${paddedSeq}`;
      const qrCodeUrl = generateQRCodeUrl(tag);

      // Random status
      let status = ASSET_STATES.AVAILABLE;
      const statusSeed = Math.random();
      if (statusSeed < 0.60) {
        status = ASSET_STATES.AVAILABLE;
      } else if (statusSeed < 0.90) {
        status = ASSET_STATES.ALLOCATED;
      } else if (statusSeed < 0.95) {
        status = ASSET_STATES.UNDER_MAINTENANCE;
      } else if (statusSeed < 0.98) {
        status = ASSET_STATES.RESERVED;
      } else {
        status = ASSET_STATES.LOST;
      }

      // Generate mock category-specific metadata
      const metadata = {};
      if (category.code === 'WKS') {
        metadata.ram_gb = [8, 16, 32, 64][Math.floor(Math.random() * 4)];
        metadata.storage_gb = [256, 512, 1024, 2048][Math.floor(Math.random() * 4)];
        metadata.os = ['macOS Sonoma', 'Windows 11 Pro', 'Ubuntu Linux'][Math.floor(Math.random() * 3)];
      } else if (category.code === 'MOB') {
        metadata.screen_size = [6.1, 6.7, 10.9, 11][Math.floor(Math.random() * 4)];
        metadata.storage_gb = [128, 256, 512][Math.floor(Math.random() * 3)];
      } else if (category.code === 'AV') {
        metadata.resolution = ['1080p', '4K Ultra HD'][Math.floor(Math.random() * 2)];
        metadata.wireless = Math.random() > 0.3;
      } else if (category.code === 'NET') {
        metadata.ports = [8, 24, 48][Math.floor(Math.random() * 3)];
        metadata.speed_gbps = [1, 10][Math.floor(Math.random() * 2)];
      } else if (category.code === 'FUR') {
        metadata.material = ['Steel Frame / Mesh', 'Polyester / Foam', 'Hardwood / Aluminum'][Math.floor(Math.random() * 3)];
        metadata.adjustable = Math.random() > 0.2;
      }

      // Assign to random employee if Allocated
      let currentHolderId = null;
      if (status === ASSET_STATES.ALLOCATED) {
        const randomEmployee = seededEmployees[Math.floor(Math.random() * seededEmployees.length)];
        currentHolderId = randomEmployee._id;
      }

      const purchaseCost = Math.floor(Math.random() * 3000) + 50;
      const purchaseDate = new Date(Date.now() - Math.floor(Math.random() * 1000) * 24 * 60 * 60 * 1000); // random date in last 3 years

      assets.push({
        name,
        tag,
        categoryId: category._id,
        departmentId: department._id,
        status,
        serialNumber: `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        purchaseDate,
        purchaseCost,
        lifecycleStage: status === ASSET_STATES.LOST ? 'Written-Off' : 'Active',
        qrCodeUrl,
        imageUrl: '',
        documents: [],
        metadata,
        currentHolderId,
        createdBy: creatorId
      });
    }

    const seededAssets = await Asset.insertMany(assets);

    // 7. Seed Asset Allocations (300 logs)
    logger.info('📁 Seeding 300 Asset Allocations logs...');
    const allocations = [];
    const allocatedAssetsList = seededAssets.filter(ast => ast.status === ASSET_STATES.ALLOCATED);
    const availableAssetsList = seededAssets.filter(ast => ast.status === ASSET_STATES.AVAILABLE);

    // Allocations for currently allocated assets
    allocatedAssetsList.forEach((ast, idx) => {
      if (idx < 300) {
        allocations.push({
          assetId: ast._id,
          assigneeId: ast.currentHolderId,
          allocatedById: creatorId,
          allocatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          expectedReturnDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          conditionOnAllocation: 'Good / Corporate Clean',
          status: 'Active'
        });
      }
    });

    // Historic allocations that are returned
    for (let j = 0; j < (300 - allocations.length); j++) {
      if (availableAssetsList[j]) {
        const randomEmp = seededEmployees[Math.floor(Math.random() * seededEmployees.length)];
        allocations.push({
          assetId: availableAssetsList[j]._id,
          assigneeId: randomEmp._id,
          allocatedById: creatorId,
          allocatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          expectedReturnDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          actualReturnDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
          conditionOnAllocation: 'Excellent',
          conditionOnReturn: 'Good',
          status: 'Returned'
        });
      }
    }
    await AssetAllocation.insertMany(allocations);

    // 8. Seed Bookings (300 logs)
    logger.info('📅 Seeding 300 Resource Bookings...');
    const bookings = [];
    const bookableAssets = seededAssets.filter(ast => ast.status === ASSET_STATES.RESERVED || ast.status === ASSET_STATES.AVAILABLE);

    for (let j = 0; j < 300; j++) {
      const asset = bookableAssets[j % bookableAssets.length];
      const booker = seededEmployees[Math.floor(Math.random() * seededEmployees.length)];
      
      const startTime = new Date(Date.now() + (j - 150) * 12 * 60 * 60 * 1000); // spread across historical & upcoming
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      let bStatus = BOOKING_STATUS.UPCOMING;
      if (startTime < new Date()) {
        bStatus = BOOKING_STATUS.COMPLETED;
      }

      bookings.push({
        resourceId: asset._id,
        bookedById: booker._id,
        startTime,
        endTime,
        status: bStatus,
        reason: ['Product Demo Presentation', 'Team Alignment Sprint', 'Inter-department Sync', 'Board Meeting Prep', 'Training Session'][j % 5],
        createdBy: booker._id
      });
    }
    await Booking.insertMany(bookings);

    // 9. Seed Maintenance Requests (150 logs)
    logger.info('🔧 Seeding 150 Maintenance Requests...');
    const maintRequests = [];
    const maintAssets = seededAssets.filter(ast => ast.status === ASSET_STATES.UNDER_MAINTENANCE || ast.status === ASSET_STATES.AVAILABLE);

    for (let j = 0; j < 150; j++) {
      const asset = maintAssets[j % maintAssets.length];
      const reporter = seededEmployees[Math.floor(Math.random() * seededEmployees.length)];
      const technician = seededEmployees.find(e => e.roleId.toString() === rolesMap[ROLES.ASSET_MANAGER].toString()) || seededEmployees[0];

      let mStatus = MAINTENANCE_STATUS.RESOLVED;
      if (j < 20) {
        mStatus = MAINTENANCE_STATUS.PENDING_APPROVAL;
      } else if (j < 50) {
        mStatus = MAINTENANCE_STATUS.APPROVED;
      } else if (j < 100) {
        mStatus = MAINTENANCE_STATUS.IN_PROGRESS;
      }

      const estCost = Math.floor(Math.random() * 300) + 20;
      const actCost = mStatus === MAINTENANCE_STATUS.RESOLVED ? estCost - 10 : 0;

      maintRequests.push({
        assetId: asset._id,
        reportedById: reporter._id,
        description: ['Display backlight flickering', 'RAM memory upgrade request', 'Battery replacement cycle', 'Sticky keys on workstation keyboard', 'WiFi card loose connection', 'Desk height motor failing', 'Switch fan making loud humming noise'][j % 7],
        priority: ['Low', 'Medium', 'High', 'Critical'][j % 4],
        status: mStatus,
        assignedTechnicianId: mStatus !== MAINTENANCE_STATUS.PENDING_APPROVAL ? technician._id : null,
        estimatedCost: estCost,
        actualCost: actCost,
        approvedById: mStatus !== MAINTENANCE_STATUS.PENDING_APPROVAL ? creatorId : null,
        createdBy: reporter._id
      });
    }
    await MaintenanceRequest.insertMany(maintRequests);

    // 10. Seed Audit Cycles (50 cycles)
    logger.info('📋 Seeding 50 Audit Cycles & verification items...');
    const auditCycles = [];
    for (let j = 1; j <= 50; j++) {
      const startDate = new Date(Date.now() - (50 - j) * 15 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000);
      
      let status = AUDIT_CYCLE_STATUS.COMPLETED;
      if (j === 50) {
        status = AUDIT_CYCLE_STATUS.IN_PROGRESS;
      } else if (j === 49) {
        status = AUDIT_CYCLE_STATUS.SCHEDULED;
      }

      auditCycles.push({
        name: `Q${(j % 4) + 1} Enterprise Compliance Audit Cycle #${j}`,
        startDate,
        endDate,
        status,
        assignedAuditors: [seededEmployees[0]._id, seededEmployees[1]._id],
        createdBy: creatorId
      });
    }
    const seededCycles = await AuditCycle.insertMany(auditCycles);

    // Seed audit items for completed and in-progress cycles (around 500 records)
    const auditItems = [];
    const sampleAssets = seededAssets.slice(0, 100);
    const auditor = seededEmployees[0]._id;

    for (let c = 0; c < seededCycles.length; c++) {
      const cycle = seededCycles[c];
      if (cycle.status === AUDIT_CYCLE_STATUS.COMPLETED || cycle.status === AUDIT_CYCLE_STATUS.IN_PROGRESS) {
        // Audit 10 items for each active/completed cycle
        for (let a = 0; a < 10; a++) {
          const asset = sampleAssets[(c * 10 + a) % sampleAssets.length];
          const statuses = Object.values(AUDIT_ITEM_STATUS);
          const randStatus = Math.random() > 0.1 ? AUDIT_ITEM_STATUS.VERIFIED : statuses[Math.floor(Math.random() * statuses.length)];

          auditItems.push({
            cycleId: cycle._id,
            assetId: asset._id,
            auditorId: auditor,
            status: randStatus,
            notes: randStatus === AUDIT_ITEM_STATUS.VERIFIED ? 'Scanned successfully.' : 'Discrepancy resolved.',
            verifiedAt: new Date(cycle.startDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            createdBy: auditor
          });
        }
      }
    }
    await AuditItem.insertMany(auditItems);

    // 11. Seed Activity Timeline logs
    logger.info('📝 Seeding recent Activity logs...');
    const activityLogs = [];
    const actionsList = ['REGISTER_ASSET', 'UPDATE_ASSET', 'ALLOCATE_ASSET', 'RETURN_ASSET', 'MAINTENANCE_REQUEST', 'RESOLVE_MAINTENANCE', 'CREATE_AUDIT_CYCLE'];

    for (let a = 0; a < 30; a++) {
      const user = seededEmployees[Math.floor(Math.random() * seededEmployees.length)];
      const asset = seededAssets[Math.floor(Math.random() * seededAssets.length)];
      const action = actionsList[a % actionsList.length];

      activityLogs.push({
        userId: user._id,
        action,
        collectionName: 'Assets',
        recordId: asset._id,
        newValue: { name: asset.name, tag: asset.tag },
        ipAddress: '127.0.0.1',
        userAgent: 'Hackathon Automated Seeder Engine',
        timestamp: new Date(Date.now() - a * 45 * 60 * 1000) // Spread over last 24 hours
      });
    }
    await ActivityLog.insertMany(activityLogs);

    logger.info('🏆 Successfully seeded database with massive Hackathon mock dataset!');
    return { success: true, message: 'Sample data generated successfully!' };

  } catch (error) {
    logger.error(`❌ Hackathon seeding failure: ${error.message}\nStack: ${error.stack}`);
    throw error;
  }
};

module.exports = seedDemoData;
