const express = require('express');
const DepartmentController = require('../controllers/DepartmentController');
const validate = require('../middlewares/validation');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');
const { createDepartmentSchema, updateDepartmentSchema } = require('../validators/departmentValidator');

const router = express.Router();

router.use(authenticate);

router.get('/hierarchy', requirePermission(PERMISSIONS.DEPT_READ), DepartmentController.getDepartmentHierarchy);
router.post('/', requirePermission(PERMISSIONS.DEPT_WRITE), validate(createDepartmentSchema), DepartmentController.createDepartment);
router.put('/:id', requirePermission(PERMISSIONS.DEPT_WRITE), validate(updateDepartmentSchema), DepartmentController.updateDepartment);
router.post('/:id/deactivate', requirePermission(PERMISSIONS.DEPT_DELETE), DepartmentController.deactivateDepartment);

module.exports = router;
