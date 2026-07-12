const express = require('express');

const authRoutes = require('./authRoutes');
const departmentRoutes = require('./departmentRoutes');
const categoryRoutes = require('./categoryRoutes');
const assetRoutes = require('./assetRoutes');
const allocationRoutes = require('./allocationRoutes');
const bookingRoutes = require('./bookingRoutes');
const maintenanceRoutes = require('./maintenanceRoutes');
const auditRoutes = require('./auditRoutes');
const reportRoutes = require('./reportRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

// Register sub-routers
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/assets', assetRoutes);
router.use('/allocations', allocationRoutes);
router.use('/bookings', bookingRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/audits', auditRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
