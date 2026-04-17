require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

const { connectDB } = require('./config/db');
const { securityMiddleware } = require('./middleware/security');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const pebRoutes = require('./routes/pebRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');

const v1EstimateRoutes = require('./routes/v1/estimateRoutes');
const v1LeadRoutes = require('./routes/v1/leadRoutes');
const v1AuthRoutes = require('./routes/v1/authRoutes');

// Required ENV
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'CORS_ORIGIN'];

// -----------------------------
// ENV VALIDATION
// -----------------------------
function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[startup] Missing ENV: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// -----------------------------
// CREATE APP
// -----------------------------
function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // Middleware
  app.use(securityMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // -----------------------------
  // HEALTH CHECK
  // -----------------------------
  app.get('/health', (req, res) => {
    const mongoReady = mongoose.connection.readyState === 1;

    res.status(200).json({
      success: true,
      status: 'ok',
      ready: mongoReady,
      timestamp: new Date().toISOString(),
    });
  });

  // -----------------------------
  // ROUTES
  // -----------------------------
  app.use('/api/peb', pebRoutes);
  app.use('/api/payments', paymentRoutes);

  app.use('/api/auth', authRoutes);
  app.use('/api/leads', leadRoutes);

  app.use('/api/v1/auth', v1AuthRoutes);
  app.use('/api/v1/leads', v1LeadRoutes);
  app.use('/api/v1/estimates', v1EstimateRoutes);

  app.use('/api/admin', adminRoutes);
  app.use('/api/api-keys', apiKeyRoutes);

  // -----------------------------
  // ERROR HANDLING
  // -----------------------------
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

// -----------------------------
// START SERVER
// -----------------------------
async function startServer() {
  try {
    console.log('[startup] Validating environment...');
    validateEnv();

    console.log('[startup] Connecting to MongoDB...');
    await connectDB(); // ✅ SINGLE connection

    const app = createApp();

    const port = Number(process.env.PORT) || 5000;

    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`[startup] Server running on 0.0.0.0:${port}`);
      console.log(`[startup] Health check: /health`);
    });

    // -----------------------------
    // GLOBAL ERROR HANDLING
    // -----------------------------
    process.on('unhandledRejection', (err) => {
      console.error('[fatal] Unhandled Rejection:', err);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      console.error('[fatal] Uncaught Exception:', err);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error('[fatal] Startup failed:', error.message);
    process.exit(1);
  }
}

// -----------------------------
// RUN
// -----------------------------
if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer,
};