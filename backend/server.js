const app = require('./app');
const connectDB = require('./src/database/db');
const seedData = require('./src/database/seed');
const env = require('./src/config/environment');
const logger = require('./src/config/logger');
const scheduler = require('./src/jobs/scheduler');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down... \nError: ${err.message} \nStack: ${err.stack}`);
  process.exit(1);
});

let server;

const startServer = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Run Database Seeding
  await seedData();

  // 3. Start Background Scheduler Jobs
  scheduler.start();
  logger.info('Background scheduler jobs initialized.');

  // 4. Start Express Server
  const PORT = env.PORT || 5000;
  server = app.listen(PORT, () => {
    logger.info(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! Shutting down... \nError: ${err.message} \nStack: ${err.stack}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
