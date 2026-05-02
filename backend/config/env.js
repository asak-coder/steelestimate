require('dotenv').config();

const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
};

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key] || !String(process.env[key]).trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = {
  env,
  validateEnv,
  REQUIRED_ENV_VARS
};
