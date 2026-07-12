const AuthService = require('../services/AuthService');
const ApiResponse = require('../utils/response');

class AuthController {
  async signup(req, res, next) {
    try {
      const result = await AuthService.signup(req.body);
      res.status(201).json(ApiResponse.created(result, 'Signup successful! Please check your email to verify your account.'));
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json(ApiResponse.success(result, 'Login successful!'));
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.status(200).json(ApiResponse.success(result, 'Token refreshed successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      const result = await AuthService.verifyEmail(token);
      res.status(200).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.status(200).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPassword(token, newPassword);
      res.status(200).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const result = await AuthService.updateProfile(req.user.id, req.body);
      res.status(200).json(ApiResponse.success(result, 'Profile updated successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async promoteUser(req, res, next) {
    try {
      const { userId, roleName } = req.body;
      const result = await AuthService.promoteUser(userId, roleName, {
        _id: req.user.id,
        roleId: req.user.roleId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(200).json(ApiResponse.success(result, 'User role updated successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async deactivateUser(req, res, next) {
    try {
      const { userId } = req.body;
      const result = await AuthService.deactivateUser(userId, {
        _id: req.user.id,
        roleId: req.user.roleId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(200).json(ApiResponse.success(result, 'User account deactivated.'));
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      const UserRepository = require('../repositories/UserRepository');
      const result = await UserRepository.find({}, { populate: 'roleId departmentId' });
      res.status(200).json(ApiResponse.success(result, 'Users list retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
