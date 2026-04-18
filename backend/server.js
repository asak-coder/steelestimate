const express = require('express');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const { securityMiddleware } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, adminLimiter } = require('./middleware/rateLimiters');

const authRoutes = require('./routes/authRoutes');
const v1AuthRoutes = require('./routes/v1/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.set('trust proxy', 1);

app.use(...securityMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/admin', adminLimiter);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', v1AuthRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
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
