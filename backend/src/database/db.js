const mongoose = require('mongoose');
const logger = require('../config/logger');
const env = require('../config/environment');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error event: ${err.message}`);
});

module.exports = connectDB;
