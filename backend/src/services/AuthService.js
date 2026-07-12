const crypto = require('crypto');
const UserRepository = require('../repositories/UserRepository');
const RoleRepository = require('../repositories/RoleRepository');
const DepartmentRepository = require('../repositories/DepartmentRepository');
const tokenUtil = require('../utils/token');
const notificationDispatcher = require('../notifications/notificationDispatcher');
const appEventEmitter = require('../events/eventEmitter');
const { BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { ROLES } = require('../constants');

class AuthService {
  async signup(userData) {
    const { name, email, password, departmentId } = userData;

    // Check if email already registered
    const existingUser = await UserRepository.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Email address is already in use.');
    }

    // Default registration role is always Employee
    const employeeRole = await RoleRepository.findByName(ROLES.EMPLOYEE);
    if (!employeeRole) {
      throw new NotFoundError('Default Employee role not initialized in database.');
    }

    // Validate department if provided
    if (departmentId) {
      const dept = await DepartmentRepository.findById(departmentId);
      if (!dept || !dept.isActive) {
        throw new BadRequestError('Invalid or inactive department specified.');
      }
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await UserRepository.create({
      name,
      email,
      password,
      roleId: employeeRole._id,
      departmentId: departmentId || null,
      verificationToken,
      isEmailVerified: false,
      isActive: true,
    });

    // Send verification email
    await notificationDispatcher.sendVerificationEmail(newUser, verificationToken);

    return {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      isEmailVerified: newUser.isEmailVerified,
    };
  }

  async login(email, password) {
    // Retrieve user with password select
    const user = await UserRepository.findByEmail(email, true);
    if (!user || !(await user.comparePassword(password, user.password))) {
      throw new UnauthorizedError('Incorrect email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact an administrator.');
    }

    // Generate JWT access & refresh tokens
    const accessToken = tokenUtil.generateAccessToken(user._id);
    const refreshToken = tokenUtil.generateRefreshToken(user._id);

    // Populate role info
    const populatedUser = await UserRepository.findById(user._id, { populate: 'roleId departmentId' });

    return {
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.roleId.name,
        department: populatedUser.departmentId ? populatedUser.departmentId.name : null,
        isEmailVerified: populatedUser.isEmailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token) {
    try {
      const decoded = tokenUtil.verifyRefreshToken(token);
      
      const user = await UserRepository.findById(decoded.id, { populate: 'roleId' });
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User account is invalid or deactivated.');
      }

      const newAccessToken = tokenUtil.generateAccessToken(user._id);
      const newRefreshToken = tokenUtil.generateRefreshToken(user._id);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token. Please log in again.');
    }
  }

  async verifyEmail(token) {
    const user = await UserRepository.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestError('Invalid or expired email verification token.');
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return { message: 'Email verified successfully!' };
  }

  async forgotPassword(email) {
    const user = await UserRepository.findOne({ email });
    if (!user) {
      // Security standard: don't reveal user existence, return success message anyway
      return { message: 'If the email matches an account, a password reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    await notificationDispatcher.sendPasswordResetEmail(user, resetToken);

    return { message: 'If the email matches an account, a password reset link has been sent.' };
  }

  async resetPassword(token, newPassword) {
    const user = await UserRepository.findByPasswordResetToken(token);
    if (!user) {
      throw new BadRequestError('Password reset token is invalid or has expired.');
    }

    user.password = newPassword; // Will trigger pre-save hashing
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password reset successful!' };
  }

  async updateProfile(userId, updateData) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    // Explicitly restrict updating security credentials or roles from this route
    delete updateData.roleId;
    delete updateData.email;
    delete updateData.isEmailVerified;
    delete updateData.isActive;

    if (updateData.password) {
      user.password = updateData.password;
    }
    if (updateData.name) {
      user.name = updateData.name;
    }
    if (updateData.departmentId) {
      const dept = await DepartmentRepository.findById(updateData.departmentId);
      if (!dept || !dept.isActive) {
        throw new BadRequestError('Invalid or inactive department.');
      }
      user.departmentId = updateData.departmentId;
    }

    await user.save();
    
    // Fetch updated user to return clean structure
    return await UserRepository.findById(userId, { populate: 'roleId departmentId' });
  }

  async promoteUser(userId, newRoleName, triggeredByUser) {
    // Verification: admin checks
    if (triggeredByUser.roleId.name !== ROLES.ADMIN) {
      throw new ForbiddenError('Only Administrators can promote or modify user roles.');
    }

    if (userId.toString() === triggeredByUser._id.toString()) {
      throw new ForbiddenError('You cannot promote or modify your own role.');
    }

    const targetUser = await UserRepository.findById(userId, { populate: 'roleId' });
    if (!targetUser) {
      throw new NotFoundError('Target user not found.');
    }

    // Restrict Admin creations unless by Admin (which is covered, but keep code self-contained)
    if (newRoleName === ROLES.ASSET_MANAGER || newRoleName === ROLES.ADMIN || newRoleName === ROLES.DEPARTMENT_HEAD) {
      // Only Admin can create manager/admin/dept-head
      // (This is triggeredByUser = Admin, so it is allowed)
    }

    const newRole = await RoleRepository.findByName(newRoleName);
    if (!newRole) {
      throw new NotFoundError(`Role '${newRoleName}' does not exist.`);
    }

    const oldRoleName = targetUser.roleId.name;
    targetUser.roleId = newRole._id;
    await targetUser.save();

    // Trigger promotion event for audit log and in-app/email alerts
    appEventEmitter.emit('user.promoted', {
      targetUser,
      oldRoleName,
      newRoleName,
      triggeredBy: {
        id: triggeredByUser._id,
        ip: triggeredByUser.ip,
        userAgent: triggeredByUser.userAgent,
      },
    });

    return targetUser;
  }

  async deactivateUser(userId, triggeredByUser) {
    // Only Admin can deactivate users
    if (triggeredByUser.roleId.name !== ROLES.ADMIN) {
      throw new ForbiddenError('Only Administrators can deactivate user accounts.');
    }

    if (userId.toString() === triggeredByUser._id.toString()) {
      throw new ForbiddenError('You cannot deactivate your own account.');
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    // Emit activity log
    appEventEmitter.emit('activity.log', {
      userId: triggeredByUser._id,
      action: 'DEACTIVATE_USER',
      collectionName: 'Users',
      recordId: user._id,
      newValue: { isActive: false, deactivatedAt: user.deactivatedAt },
      ipAddress: triggeredByUser.ip,
      userAgent: triggeredByUser.userAgent,
    });

    return user;
  }
}

module.exports = new AuthService();
