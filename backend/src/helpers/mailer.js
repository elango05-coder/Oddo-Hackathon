const nodemailer = require('nodemailer');
const env = require('../config/environment');
const logger = require('../config/logger');

const isMockMail = env.SMTP_USER === 'mock-smtp-user';

let transporter;
if (!isMockMail) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

const sendMail = async ({ to, subject, html, text }) => {
  try {
    if (isMockMail) {
      logger.info(`[MAILER MOCK] Sending email:
        TO: ${to}
        SUBJECT: ${subject}
        HTML: ${html.substring(0, 150)}...
      `);
      return { messageId: `mock-email-${Date.now()}` };
    }

    const mailOptions = {
      from: env.FROM_EMAIL,
      to,
      subject,
      text: text || '',
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    // Do not throw in non-production environments to avoid stopping flow
    if (env.NODE_ENV === 'production') {
      throw error;
    }
    return null;
  }
};

module.exports = {
  sendMail,
};
