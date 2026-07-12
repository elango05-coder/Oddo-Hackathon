const express = require('express');
const AssetController = require('../controllers/AssetController');
const validate = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');
const { registerAssetSchema, updateAssetSchema } = require('../validators/assetValidator');

const router = express.Router();

router.use(authenticate);

router.get('/search', requirePermission(PERMISSIONS.ASSET_READ), AssetController.searchAssets);
router.get('/:id', requirePermission(PERMISSIONS.ASSET_READ), AssetController.getAssetDetail);
router.get('/:id/history', requirePermission(PERMISSIONS.ASSET_READ), AssetController.getAssetHistory);

router.post(
  '/',
  requirePermission(PERMISSIONS.ASSET_WRITE),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'documents', maxCount: 5 },
  ]),
  validate(registerAssetSchema),
  AssetController.registerAsset
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.ASSET_WRITE),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'documents', maxCount: 5 },
  ]),
  validate(updateAssetSchema),
  AssetController.updateAsset
);

router.delete('/:id', requirePermission(PERMISSIONS.ASSET_DELETE), AssetController.deleteAsset);

module.exports = router;
