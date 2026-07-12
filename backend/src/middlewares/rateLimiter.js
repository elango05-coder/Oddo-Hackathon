const rateLimit = require('express-rate-limit');
const env = require('../config/environment');
const ApiResponse = require('../utils/response');

const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(
      ApiResponse.error('Too many requests from this IP, please try again after 15 minutes', 429)
    );
  },
});

module.exports = apiLimiter;
