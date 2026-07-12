const NotificationRepository = require('../repositories/NotificationRepository');
const { sendMail } = require('../helpers/mailer');
const logger = require('../config/logger');
const env = require('../config/environment');

class NotificationDispatcher {
  async send({ userId, title, message, type = 'System', sendEmail = false, emailTo = null, emailSubject = '' }) {
    try {
      // 1. Save to Database
      await NotificationRepository.create({
        userId,
        title,
        message,
        type: sendEmail ? 'Both' : 'System',
      });

      // 2. Dispatch Email if required
      if (sendEmail && emailTo) {
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">${title}</h2>
            <p>${message}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #777;">This is an automated notification from AssetFlow. Please do not reply directly to this message.</p>
          </div>
        `;
        await sendMail({
          to: emailTo,
          subject: emailSubject || title,
          html,
        });
      }
    } catch (error) {
      logger.error(`Notification Dispatch Error: ${error.message}`);
    }
  }

  async sendVerificationEmail(user, token) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Email Verification Required</h2>
        <p>Dear ${user.name},</p>
        <p>Thank you for registering on AssetFlow. Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Verify Email</a>
        <p>Or paste this URL into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">If you did not request this registration, please ignore this email.</p>
      </div>
    `;
    await sendMail({
      to: user.email,
      subject: 'AssetFlow - Verify Your Email',
      html,
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>Dear ${user.name},</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="background-color: #EF4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Reset Password</a>
        <p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">AssetFlow Security Team</p>
      </div>
    `;
    await sendMail({
      to: user.email,
      subject: 'AssetFlow - Reset Your Password',
      html,
    });
  }
}

module.exports = new NotificationDispatcher();
