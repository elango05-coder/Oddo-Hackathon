const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const AssetCategory = require('../models/AssetCategory');
const Asset = require('../models/Asset');
const AssetAllocation = require('../models/AssetAllocation');
const Booking = require('../models/Booking');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { CENTRAL_PERMISSION_MATRIX } = require('../constants');

// Override database URI for testing
const TEST_DB_URI = 'mongodb://localhost:27017/assetflow_test';

beforeAll(async () => {
  // Disconnect any existing connection and reconnect to test DB
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_DB_URI);
  
  // Clear collections
  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({}),
    Department.deleteMany({}),
    AssetCategory.deleteMany({}),
    Asset.deleteMany({}),
    AssetAllocation.deleteMany({}),
    Booking.deleteMany({}),
    MaintenanceRequest.deleteMany({}),
  ]);

  // Seed default roles
  const roles = [];
  for (const [roleName, permissions] of Object.entries(CENTRAL_PERMISSION_MATRIX)) {
    roles.push({ name: roleName, permissions });
  }
  await Role.insertMany(roles);
});

afterAll(async () => {
  // Cleanup test database
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe('AssetFlow Complete ERP Integration Tests', () => {
  let adminToken;
  let employeeToken;
  let adminUser;
  let employeeUser;
  let testDepartment;
  let testCategory;
  let testAsset;
  let testBooking;
  let testMaintRequest;

  // 1. SEED/CREATE System Administrator
  it('should seed or register a System Administrator and login', async () => {
    const adminRole = await Role.findOne({ name: 'Admin' });
    
    // Create Administrator account
    adminUser = await User.create({
      name: 'Test Administrator',
      email: 'admin-test@assetflow.com',
      password: 'adminpassword123', // hooks hash it
      roleId: adminRole._id,
      isEmailVerified: true,
      isActive: true,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin-test@assetflow.com',
        password: 'adminpassword123',
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.accessToken).toBeDefined();
    adminToken = loginRes.body.data.accessToken;
  });

  // 2. EMPLOYEE SIGNUP
  it('should allow a new Employee to sign up and login after verifying email', async () => {
    const signupRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'John Employee',
        email: 'john-test@assetflow.com',
        password: 'johnpassword123',
      });

    expect(signupRes.statusCode).toBe(201);
    
    // Verify email manually (since we bypass actual email send)
    const user = await User.findOne({ email: 'john-test@assetflow.com' }).select('+verificationToken');
    expect(user.isEmailVerified).toBe(false);

    const verifyRes = await request(app)
      .get(`/api/v1/auth/verify-email?token=${user.verificationToken}`);
    expect(verifyRes.statusCode).toBe(200);

    // Login Employee
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'john-test@assetflow.com',
        password: 'johnpassword123',
      });
    expect(loginRes.statusCode).toBe(200);
    employeeToken = loginRes.body.data.accessToken;
    employeeUser = await User.findOne({ email: 'john-test@assetflow.com' });
  });

  // 3. ADMIN CREATES DEPARTMENTS
  it('should allow Admin to create a department', async () => {
    const deptRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Information Technology',
        code: 'IT',
      });

    expect(deptRes.statusCode).toBe(201);
    expect(deptRes.body.data.name).toBe('Information Technology');
    testDepartment = deptRes.body.data;
  });

  // 4. ADMIN PROMOTE EMPLOYEE TO DEPARTMENT HEAD
  it('should allow Admin to assign Employee as Department Head and promote role', async () => {
    const promoteRes = await request(app)
      .post('/api/v1/auth/promote')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: employeeUser._id,
        roleName: 'Department Head',
      });

    expect(promoteRes.statusCode).toBe(200);
    
    // Check role was updated
    const updatedUser = await User.findById(employeeUser._id).populate('roleId');
    expect(updatedUser.roleId.name).toBe('Department Head');

    // Update Employee department in DB
    await User.findByIdAndUpdate(employeeUser._id, { departmentId: testDepartment._id });
  });

  // 5. ADMIN CREATES ASSET CATEGORY WITH DYNAMIC METADATA
  it('should allow Admin to create asset category with typed metadata definitions', async () => {
    const catRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Workstations',
        code: 'WKS',
        description: 'Company Laptops and Desktops',
        fields: [
          { name: 'ram_gb', label: 'RAM (GB)', type: 'number', required: true },
          { name: 'os', label: 'Operating System', type: 'text', required: false },
        ],
      });

    expect(catRes.statusCode).toBe(201);
    testCategory = catRes.body.data;
  });

  // 6. ASSET MANAGER / ADMIN REGISTERS ASSET
  it('should allow registering an asset and validate its dynamic category metadata', async () => {
    // Should fail if required metadata 'ram_gb' is missing
    const failRes = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'MacBook Pro 16',
        categoryId: testCategory._id,
        purchaseCost: 2500,
        purchaseDate: new Date().toISOString(),
        metadata: {
          os: 'macOS Sonoma',
        },
      });

    expect(failRes.statusCode).toBe(422); // Validation error
    expect(failRes.body.errors.ram_gb).toBeDefined();

    // Success registration with correct metadata
    const successRes = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'MacBook Pro 16',
        categoryId: testCategory._id,
        purchaseCost: 2500,
        purchaseDate: new Date().toISOString(),
        metadata: {
          ram_gb: 32,
          os: 'macOS Sonoma',
        },
      });

    expect(successRes.statusCode).toBe(201);
    expect(successRes.body.data.tag).toMatch(/^AST-\d{4}-\d{4}$/); // Tag match
    expect(successRes.body.data.qrCodeUrl).toBeDefined();
    testAsset = successRes.body.data;
  });

  // 7. ALLOCATE ASSET (CHECKOUT)
  it('should allocate an available asset to a user', async () => {
    const allocRes = await request(app)
      .post('/api/v1/allocations/checkout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId: testAsset._id,
        assigneeId: employeeUser._id,
        expectedReturnDate: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days
        conditionOnAllocation: 'Brand New',
      });

    expect(allocRes.statusCode).toBe(201);
    
    // Check asset status is Allocated
    const updatedAsset = await Asset.findById(testAsset._id);
    expect(updatedAsset.status).toBe('Allocated');
    expect(updatedAsset.currentHolderId.toString()).toBe(employeeUser._id.toString());
  });

  // 8. PREVENT DOUBLE ALLOCATION
  it('should reject checkout requests for already allocated assets', async () => {
    const doubleRes = await request(app)
      .post('/api/v1/allocations/checkout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId: testAsset._id,
        assigneeId: adminUser._id,
        expectedReturnDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        conditionOnAllocation: 'Used',
      });

    expect(doubleRes.statusCode).toBe(400);
    expect(doubleRes.body.message).toContain('is not available for checkout');
  });

  // 9. BOOK RESOURCE (BOOKING CALENDAR)
  it('should schedule upcoming booking reservations for shared items', async () => {
    // Let's make our testAsset bookable (e.g. status back to available or register another)
    const bookableAsset = await Asset.create({
      name: 'Main Conference Room',
      tag: 'AST-2026-9999',
      categoryId: testCategory._id,
      status: 'Available',
      purchaseDate: new Date(),
      purchaseCost: 5000,
    });

    const start = new Date();
    start.setHours(start.getHours() + 2);
    const end = new Date();
    end.setHours(end.getHours() + 4);

    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        resourceId: bookableAsset._id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        reason: 'Client Presentation',
      });

    expect(bookingRes.statusCode).toBe(201);
    testBooking = bookingRes.body.data;
  });

  // 10. PREVENT OVERLAPPING RESERVATIONS
  it('should block reservations that overlap existing slots', async () => {
    // Shift slightly inside the interval
    const start = new Date(testBooking.startTime);
    start.setMinutes(start.getMinutes() + 30);
    const end = new Date(testBooking.endTime);
    end.setMinutes(end.getMinutes() + 30);

    const overlapRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        resourceId: testBooking.resourceId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        reason: 'Overlapping Meetup',
      });

    expect(overlapRes.statusCode).toBe(409); // Conflict
  });

  // 11. RAISE REPAIR REQUEST & TRACK LIFECYCLE
  it('should submit maintenance requests and restrict asset status adjustments', async () => {
    const maintRes = await request(app)
      .post('/api/v1/maintenance/request')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        assetId: testAsset._id,
        description: 'Screen flickering occasionally',
        priority: 'Medium',
      });

    expect(maintRes.statusCode).toBe(201);
    testMaintRequest = maintRes.body.data;

    // Check status is still Allocated (approved before changing status)
    const currentAsset = await Asset.findById(testAsset._id);
    expect(currentAsset.status).toBe('Allocated');
  });

  // 12. APPROVE TICKET & VERIFY STATUS IS AUTOMATICALLY UNDER_MAINTENANCE
  it('should update asset status to UnderMaintenance upon approval', async () => {
    const approveRes = await request(app)
      .post(`/api/v1/maintenance/${testMaintRequest._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedTechnicianId: employeeUser._id,
        estimatedCost: 150,
      });

    expect(approveRes.statusCode).toBe(200);

    // Verify asset state is UnderMaintenance
    const currentAsset = await Asset.findById(testAsset._id);
    expect(currentAsset.status).toBe('UnderMaintenance');
  });

  // 13. RESOLVE WORK AND CONFIRM ASSET AVAILABLE AGAIN
  it('should mark asset Available and clear holder upon resolution', async () => {
    // Start work
    await request(app)
      .post(`/api/v1/maintenance/${testMaintRequest._id}/start`)
      .set('Authorization', `Bearer ${employeeToken}`);

    // Resolve
    const resolveRes = await request(app)
      .post(`/api/v1/maintenance/${testMaintRequest._id}/resolve`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        actualCost: 120,
        remarks: 'Replaced visual display flex cable. Works perfectly.',
      });

    expect(resolveRes.statusCode).toBe(200);

    // Check asset is Available again
    const finalAsset = await Asset.findById(testAsset._id);
    expect(finalAsset.status).toBe('Available');
    expect(finalAsset.currentHolderId).toBeNull();
  });
});
