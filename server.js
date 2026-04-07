const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { securityMiddleware, corsOptions } = require('./middleware/security');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const pebRoutes = require('./routes/pebRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'CORS_ORIGIN'];

function normalizeOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`[startup] Missing environment variables: ${missing.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const origins = normalizeOrigins(process.env.CORS_ORIGIN);
  if (origins.length === 0) {
    console.warn('[startup] CORS_ORIGIN is empty after normalization');
  }
}

function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(securityMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  app.get('/health', async (req, res) => {
    const hasMongoUri = Boolean(process.env.MONGO_URI || process.env.MONGODB_URI);
    const mongoReady = hasMongoUri && require('mongoose').connection.readyState === 1;

    res.status(200).json({
      success: true,
      status: 'ok',
      ready: mongoReady,
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/peb', pebRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/api-keys', apiKeyRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

async function startServer() {
  try {
    console.log('[startup] Validating environment...');
    validateEnv();

    const app = createApp();
    const port = Number(process.env.PORT) || 10000;

    const server = app.listen(port, () => {
      console.log(`[startup] Server running on port ${port}`);
      console.log(`[startup] Health check available at /health`);
    });

    connectDB().catch((error) => {
      console.error('[startup] MongoDB connection will retry on next request:', error.message);
    });

    process.on('unhandledRejection', (err) => {
      console.error('[fatal] Unhandled promise rejection:', err);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      console.error('[fatal] Uncaught exception:', err);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('[fatal] Startup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer,
  corsOptions
};
