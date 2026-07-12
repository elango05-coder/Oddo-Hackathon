const express = require('express');
const AuthController = require('../controllers/AuthController');
const validate = require('../middlewares/validation');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} = require('../validators/authValidator');

const router = express.Router();

router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

// Protected routes
router.get('/users', authenticate, AuthController.listUsers);
router.put('/update-profile', authenticate, validate(updateProfileSchema), AuthController.updateProfile);
router.post('/promote', authenticate, requirePermission(PERMISSIONS.USER_PROMOTE), AuthController.promoteUser);
router.post('/deactivate', authenticate, requirePermission(PERMISSIONS.USER_DELETE), AuthController.deactivateUser);

module.exports = router;
