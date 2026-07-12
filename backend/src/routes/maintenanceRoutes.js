const express = require('express');
const MaintenanceController = require('../controllers/MaintenanceController');
const validate = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');
const {
  raiseMaintenanceSchema,
  approveMaintenanceSchema,
  resolveMaintenanceSchema,
} = require('../validators/maintenanceValidator');

const router = express.Router();

router.use(authenticate);

router.get('/pending', requirePermission(PERMISSIONS.MAINT_READ), MaintenanceController.getPendingRequests);
router.get('/:id/logs', requirePermission(PERMISSIONS.MAINT_READ), MaintenanceController.getLogs);

router.post(
  '/request',
  requirePermission(PERMISSIONS.MAINT_WRITE),
  upload.fields([{ name: 'images', maxCount: 3 }]),
  validate(raiseMaintenanceSchema),
  MaintenanceController.raiseRequest
);

router.post('/:id/approve', requirePermission(PERMISSIONS.MAINT_APPROVE), validate(approveMaintenanceSchema), MaintenanceController.approveRequest);
router.post('/:id/start', MaintenanceController.startWork);
router.post('/:id/resolve', validate(resolveMaintenanceSchema), MaintenanceController.resolveRequest);

module.exports = router;
