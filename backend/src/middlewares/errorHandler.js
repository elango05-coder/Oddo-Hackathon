const logger = require('../config/logger');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error using Winston
  logger.error(`${req.method} ${req.originalUrl} - ${err.message} \nStack: ${err.stack}`);

  let errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    err.statusCode = 400;
    errorResponse.message = `Validation Error: ${message}`;
    errorResponse.errors = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    err.statusCode = 400;
    errorResponse.message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB duplicate key error (11000)
  if (err.code === 11000) {
    err.statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    errorResponse.message = `Duplicate field value entered: ${field}. Please use another value!`;
  }

  // JWT validation errors
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    errorResponse.message = 'Invalid token. Please log in again!';
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    errorResponse.message = 'Your token has expired! Please log in again.';
  }

  // Custom ValidationError (Zod or custom validator)
  if (err.errors && err.statusCode === 422) {
    errorResponse.errors = err.errors;
  }

  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    errorResponse.stack = err.stack;
  }

  res.status(err.statusCode).json(errorResponse);
};

module.exports = errorHandler;
