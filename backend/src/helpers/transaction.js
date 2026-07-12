const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Runs a set of operations within a Mongoose transaction session.
 * Gracefully falls back to stand-alone execution if replica set transaction support is missing.
 * 
 * @param {Function} workFn - Async function (session) => result
 * @returns {Promise<any>}
 */
const runInTransaction = async (workFn) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();

    const isStandaloneError = 
      error.message && 
      (error.message.includes('replica set member') || 
       error.message.includes('Transaction numbers') || 
       error.code === 20);

    if (isStandaloneError) {
      logger.warn('[DATABASE] Standalone MongoDB detected. Falling back to non-transactional scope.');
      // Execute without transaction session
      return await workFn(null);
    }

    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  runInTransaction,
};
