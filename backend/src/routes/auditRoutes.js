const express = require('express');
const AuditController = require('../controllers/AuditController');
const validate = require('../middlewares/validation');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');
const { createAuditCycleSchema, verifyAssetSchema } = require('../validators/auditValidator');

const router = express.Router();

router.use(authenticate);

router.get('/cycles', requirePermission(PERMISSIONS.AUDIT_READ), AuditController.getCycles);
router.get('/cycles/:id/report', requirePermission(PERMISSIONS.AUDIT_READ), AuditController.generateDiscrepancyReport);

router.post('/cycles', requirePermission(PERMISSIONS.AUDIT_WRITE), validate(createAuditCycleSchema), AuditController.createCycle);
router.post('/cycles/:id/start', requirePermission(PERMISSIONS.AUDIT_WRITE), AuditController.startCycle);
router.post('/cycles/:id/close', requirePermission(PERMISSIONS.AUDIT_CLOSE), AuditController.closeCycle);
router.post('/cycles/:id/lock', requirePermission(PERMISSIONS.AUDIT_CLOSE), AuditController.lockCycle);

router.post('/verify', requirePermission(PERMISSIONS.AUDIT_VERIFY), validate(verifyAssetSchema), AuditController.verifyAsset);

module.exports = router;
