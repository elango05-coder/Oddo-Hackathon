const express = require('express');
const ReportController = require('../controllers/ReportController');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');

const router = express.Router();

router.use(authenticate);

router.get('/utilization', requirePermission(PERMISSIONS.REPORT_READ), ReportController.getAssetUtilization);
router.get('/maintenance', requirePermission(PERMISSIONS.REPORT_READ), ReportController.getMaintenanceStats);
router.get('/idle', requirePermission(PERMISSIONS.REPORT_READ), ReportController.getIdleAssets);
router.get('/popular', requirePermission(PERMISSIONS.REPORT_READ), ReportController.getPopularAssets);
router.get('/export/csv', requirePermission(PERMISSIONS.REPORT_READ), ReportController.exportAssetsToCSV);

module.exports = router;
