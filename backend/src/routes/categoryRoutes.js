const express = require('express');
const CategoryController = require('../controllers/CategoryController');
const validate = require('../middlewares/validation');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');
const { createCategorySchema, updateCategorySchema } = require('../validators/categoryValidator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.CAT_READ), CategoryController.getCategories);
router.get('/:id', requirePermission(PERMISSIONS.CAT_READ), CategoryController.getCategory);
router.post('/', requirePermission(PERMISSIONS.CAT_WRITE), validate(createCategorySchema), CategoryController.createCategory);
router.put('/:id', requirePermission(PERMISSIONS.CAT_WRITE), validate(updateCategorySchema), CategoryController.updateCategory);

module.exports = router;
