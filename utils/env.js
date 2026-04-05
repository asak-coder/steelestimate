const AppError = require('./appError');

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CORS_ORIGIN'
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key] || !process.env[key].trim());

  if (missing.length > 0) {
    throw new AppError(`Missing required environment variables: ${missing.join(', ')}`, 500);
  }
};

module.exports = {
  validateEnv,
  requiredEnvVars
};
