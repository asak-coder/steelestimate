const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { env, validateEnv } = require('./config/env');
const securityMiddleware = require('./middleware/security');
const authRoutes = require('./routes/authRoutes');
const v1AuthRoutes = require('./routes/v1/authRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const boqRoutes = require('./routes/boqRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const leadRoutes = require('./routes/leadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const estimateRoutes = require('./routes/v1/estimateRoutes');
const aiEstimateRoutes = require('./routes/v1/aiEstimateRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

validateEnv();

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);
app.use(cookieParser());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = Buffer.from(buf);
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(securityMiddleware);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', v1AuthRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/boq', boqRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', paymentRoutes);
app.use('/api/v1/estimate', estimateRoutes);
app.use('/api/v1/estimates', estimateRoutes);
app.use('/api/ai', aiEstimateRoutes);

app.use(notFound);
app.use(errorHandler);

(async () => {
  try {
    const PORT = process.env.PORT || env.PORT || 5000;

    if (env.MONGO_URI) {
      await mongoose.connect(env.MONGO_URI);
      console.log('✅ MongoDB Connected');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup Error:', err);
    process.exit(1);
  }
})();

module.exports = app;
