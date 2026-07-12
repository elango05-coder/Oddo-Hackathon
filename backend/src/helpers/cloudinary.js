const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const env = require('../config/environment');
const logger = require('../config/logger');

const isMock = env.CLOUDINARY_CLOUD_NAME === 'mock-cloud-name' || !env.CLOUDINARY_API_KEY;

if (!isMock) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

const uploadToCloudinary = async (filePath, folder = 'assets') => {
  try {
    if (isMock) {
      logger.info(`[CLOUDINARY MOCK] Mock upload for file: ${filePath}`);
      const filename = filePath.split(/[\\/]/).pop();
      // Keep file locally in dev for static routing fallback, but clean up normally
      return {
        url: `http://localhost:${env.PORT}/uploads/${filename}`,
        public_id: `mock-id-${filename}`,
      };
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: `assetflow/${folder}`,
      resource_type: 'auto',
    });

    // Remove file from local temp storage
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`);
    // Cleanup local file even on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
};
