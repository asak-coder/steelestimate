const required = ["MONGO_URI", "JWT_SECRET", "CORS_ORIGIN"];

const normalizeUrl = (value) => String(value || "").trim().replace(/\/$/, "");

const getEnv = () => ({
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  jwtIssuer: process.env.JWT_ISSUER || "steelestimate-api",
  jwtAudience: process.env.JWT_AUDIENCE || "steelestimate-admin",
  corsOrigin: normalizeUrl(process.env.CORS_ORIGIN),
  frontendUrl: normalizeUrl(process.env.FRONTEND_URL || process.env.CORS_ORIGIN),
  adminFrontendUrl: normalizeUrl(process.env.ADMIN_FRONTEND_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN),
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development"
});

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return getEnv();
};

module.exports = {
  ...getEnv(),
  getEnv,
  validateEnv
};
