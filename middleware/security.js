const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const cors = require('cors');

function normalizeOrigin(origin) {
  return String(origin || '').trim().replace(/\/$/, '');
}

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

const defaultCorsOrigins = ['https://steelestimate.vercel.app'];
const envOrigins = parseOrigins(
  process.env.CORS_ORIGIN || process.env.FRONTEND_URL || process.env.ADMIN_FRONTEND_URL || ''
);

const corsOrigins = [...new Set([...defaultCorsOrigins, ...envOrigins].map(normalizeOrigin))];

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
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const securityMiddleware = [
  helmet(),
  mongoSanitize(),
  xssClean(),
  cors(corsOptions)
];

module.exports = {
  securityMiddleware,
  corsOptions,
  allowedOrigins: corsOrigins,
  normalizeOrigin,
  parseOrigins
};
