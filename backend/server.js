const express = require('express');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const { securityMiddleware } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { authLimiter, adminLimiter } = require('./middleware/rateLimiters');

const authRoutes = require('./routes/v1/authRoutes');
const orchestratorRoutes = require('./routes/v1/orchestratorRoutes');
const estimateRoutes = require('./routes/v1/estimateRoutes');
const leadRoutes = require('./routes/leadRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authMiddleware = require('./middleware/auth');
const { requireAuth } = authMiddleware;
const { calculateRateIntelligence } = require('./services/pricingOptimizationService');
const { runOrchestrator } = require('./modules/orchestrator/orchestrator.controller');
const { generatePdf } = require('./controllers/orchestratorController');

const app = express();

app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', (req, res, next) => next());
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/orchestrator', orchestratorRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/estimate', estimateRoutes);
app.post('/api/orchestrator/run', requireAuth, runOrchestrator);
app.get('/api/orchestrator/:id/pdf', requireAuth, generatePdf);
app.use('/api/leads', leadRoutes);
app.post('/api/v1/rate-intelligence', (req, res) => {
  try {
    const result = calculateRateIntelligence(req.body || {});
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      recommendedRateRange: { min: 0, max: 0 },
      adjustmentReason: 'Unable to calculate rate intelligence due to an unexpected server error.',
      riskLevel: 'high'
    });
  }
});

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
      console.warn('MongoDB URI not set; skipping database connection for local startup check.');
    } else {
      await connectDB();
    }
    const port = env.port || 5000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;
