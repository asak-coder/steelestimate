const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { env } = require('./config/env');
const securityMiddleware = require('./middleware/security');
const authRoutes = require('./routes/authRoutes');
const v1AuthRoutes = require('./routes/v1/authRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: 'https://steelestimate.com',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityMiddleware);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', v1AuthRoutes);
app.use('/api/sections', sectionRoutes);

app.use(notFound);
app.use(errorHandler);

(async () => {
  try {
    const PORT = process.env.PORT || env.PORT || 5000;

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI missing');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup Error:', err);
    process.exit(1);
  }
})();

module.exports = app;
