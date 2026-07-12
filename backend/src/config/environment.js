const dotenv = require('dotenv');
const path = require('path');
const { z } = require('zod');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/assetflow'),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  CLOUDINARY_CLOUD_NAME: z.string().default('mock-cloud-name'),
  CLOUDINARY_API_KEY: z.string().default('mock-api-key'),
  CLOUDINARY_API_SECRET: z.string().default('mock-api-secret'),
  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().default(2525),
  SMTP_USER: z.string().default('mock-smtp-user'),
  SMTP_PASS: z.string().default('mock-smtp-pass'),
  FROM_EMAIL: z.string().email().default('noreply@assetflow.com'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

module.exports = parsedEnv.data;
