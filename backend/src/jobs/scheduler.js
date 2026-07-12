const cron = require('node-cron');
const logger = require('../config/logger');

// We will import services dynamically inside jobs to avoid circular dependencies
const start = () => {
  // Midnight Cron Job (0 0 * * *)
  // Runs daily at 00:00 AM
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] Starting midnight automated batch jobs...');
    
    try {
      const allocationService = require('../services/AllocationService');
      logger.info('[CRON] Checking for overdue allocations...');
      await allocationService.processOverdueAllocations();
    } catch (err) {
      logger.error(`[CRON] Overdue allocation check failed: ${err.message}`);
    }

    try {
      const bookingService = require('../services/BookingService');
      logger.info('[CRON] Sending resource booking reminders...');
      await bookingService.sendBookingReminders();
      logger.info('[CRON] Expiring outdated pending bookings...');
      await bookingService.expirePendingBookings();
    } catch (err) {
      logger.error(`[CRON] Booking scheduler jobs failed: ${err.message}`);
    }

    try {
      const dashboardService = require('../services/DashboardService');
      logger.info('[CRON] Rebuilding dashboard metrics cache...');
      await dashboardService.rebuildCache();
    } catch (err) {
      logger.error(`[CRON] Dashboard cache rebuilding failed: ${err.message}`);
    }

    logger.info('[CRON] Midnight automated batch jobs finished.');
  });

  // A helper cron that runs every 5 minutes in development or just keeps scheduler alive/monitored
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('*/30 * * * *', () => {
      logger.info('[CRON] Scheduler heartbeat - OK');
    });
  }
};

module.exports = {
  start,
};
