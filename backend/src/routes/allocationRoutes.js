const express = require('express');
const AllocationController = require('../controllers/AllocationController');
const validate = require('../middlewares/validation');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');
const {
  allocateAssetSchema,
  requestTransferSchema,
  returnAssetSchema,
} = require('../validators/allocationValidator');

const router = express.Router();

router.use(authenticate);

router.get('/active', requirePermission(PERMISSIONS.ALLOC_READ), AllocationController.getActiveAllocations);
router.get('/transfers/pending', requirePermission(PERMISSIONS.TRANSFER_READ), AllocationController.getPendingTransfers);

router.post('/checkout', requirePermission(PERMISSIONS.ALLOC_WRITE), validate(allocateAssetSchema), AllocationController.allocateAsset);
router.post('/return', requirePermission(PERMISSIONS.ALLOC_WRITE), validate(returnAssetSchema), AllocationController.returnAsset);

router.post('/transfer', requirePermission(PERMISSIONS.TRANSFER_WRITE), validate(requestTransferSchema), AllocationController.requestTransfer);
router.post('/transfer/:id/approve', requirePermission(PERMISSIONS.TRANSFER_APPROVE), AllocationController.approveTransfer);
router.post('/transfer/:id/reject', requirePermission(PERMISSIONS.TRANSFER_APPROVE), AllocationController.rejectTransfer);

module.exports = router;
