const { verifyAccessToken } = require('../utils/token');
const UserRepository = require('../repositories/UserRepository');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('You are not logged in. Please log in to get access.');
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Check if user still exists and is active
    const user = await UserRepository.findById(decoded.id, { populate: 'roleId' });
    if (!user) {
      throw new UnauthorizedError('The user belonging to this token no longer exists.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('This account has been deactivated.');
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.roleId) {
        throw new UnauthorizedError('User authentication role context missing.');
      }

      const userPermissions = req.user.roleId.permissions || [];
      const hasPermission = userPermissions.includes(permission);

      if (!hasPermission) {
        throw new ForbiddenError('You do not have permission to perform this action.');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const isEmailVerified = (req, res, next) => {
  try {
    if (!req.user.isEmailVerified) {
      throw new ForbiddenError('Please verify your email address to access this resource.');
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  requirePermission,
  isEmailVerified,
};
