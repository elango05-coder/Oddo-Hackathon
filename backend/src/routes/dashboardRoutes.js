const express = require('express');
const DashboardController = require('../controllers/DashboardController');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.DASHBOARD_READ), DashboardController.getDashboardData);
router.post('/rebuild-cache', requirePermission(PERMISSIONS.DASHBOARD_READ), DashboardController.rebuildCache);
router.post('/seed-demo', requirePermission(PERMISSIONS.DASHBOARD_READ), DashboardController.seedDemoData);

module.exports = router;
