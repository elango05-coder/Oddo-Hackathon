const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');
const Role = require('../models/Role');
const User = require('../models/User');
const { CENTRAL_PERMISSION_MATRIX } = require('../constants');
const logger = require('../config/logger');
const env = require('../config/environment');

const seedData = async () => {
  try {
    logger.info('Starting database seeding...');
    
    // Seed Roles
    const rolesMap = {};
    for (const [roleName, permissions] of Object.entries(CENTRAL_PERMISSION_MATRIX)) {
      let role = await Role.findOne({ name: roleName });
      if (!role) {
        role = await Role.create({
          name: roleName,
          permissions,
        });
        logger.info(`Seeded Role: ${roleName}`);
      } else {
        // Sync permissions if they have changed in code matrix
        role.permissions = permissions;
        await role.save();
        logger.info(`Synced Role: ${roleName}`);
      }
      rolesMap[roleName] = role._id;
    }

    // Seed Admin User
    const adminEmail = 'admin@assetflow.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      // Create default admin
      const adminRole = rolesMap['Admin'];
      admin = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: 'adminpassword123', // Will be hashed by pre-save hook
        roleId: adminRole,
        isEmailVerified: true,
        isActive: true,
      });
      logger.info(`Seeded Default Admin User: ${adminEmail}`);
    } else {
      logger.info('Admin user already exists.');
    }

    // Automatically trigger Sandbox demo data seeder if no employees exist yet
    const employeeCount = await User.countDocuments({ email: { $ne: adminEmail } });
    if (employeeCount < 5) {
      logger.info('Fewer than 5 sandbox employees found. Auto-generating demo database sandbox...');
      const seedDemoData = require('./demoSeeder');
      await seedDemoData();
    }

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    throw error;
  }
};

// If run directly (e.g. node seed.js)
if (require.main === module) {
  const run = async () => {
    await connectDB();
    await seedData();
    await mongoose.connection.close();
    process.exit(0);
  };
  run();
}

module.exports = seedData;
