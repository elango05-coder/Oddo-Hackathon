const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${req.ip} - Agent: ${req.headers['user-agent']}`);
  });
  next();
};

module.exports = requestLogger;
