const helmet = require("helmet");
const cors = require("cors");

let mongoSanitize = null;
try {
  mongoSanitize = require("express-mongo-sanitize");
} catch (error) {
  mongoSanitize = null;
}

let xssClean = null;
try {
  xssClean = require("xss-clean");
} catch (error) {
  xssClean = null;
}

function normalizeOrigin(origin) {
  return String(origin || "").trim().replace(/\/$/, "");
}

function parseOrigins(value) {
  return String(value || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

const frontendUrl = normalizeOrigin(
  process.env.FRONTEND_URL || process.env.ADMIN_FRONTEND_URL || "https://steelestimate.com"
);
const envOrigins = parseOrigins(process.env.CORS_ORIGIN || "");
const corsOrigins = [...new Set([frontendUrl, ...envOrigins].map(normalizeOrigin))];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const requestOrigin = normalizeOrigin(origin);
    if (corsOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${requestOrigin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false
  })
];

if (typeof mongoSanitize === "function") {
  securityMiddleware.push(mongoSanitize());
}

if (typeof xssClean === "function") {
  securityMiddleware.push(xssClean());
}

securityMiddleware.push(cors(corsOptions));

module.exports = {
  securityMiddleware,
  corsOptions,
  allowedOrigins: corsOrigins,
  normalizeOrigin,
  parseOrigins
};
