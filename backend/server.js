const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { env } = require('./config/env');
const { connectDB } = require('./config/db');
const securityMiddleware = require('./middleware/security');
const authRoutes = require('./routes/authRoutes');
const v1AuthRoutes = require('./routes/v1/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

console.log('ENV CHECK:', {
  hasMongo: !!process.env.MONGO_URI,
  hasJWT: !!process.env.JWT_SECRET,
  hasOpenAI: !!process.env.OPENAI_API_KEY,
  corsOrigin: process.env.CORS_ORIGIN
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(securityMiddleware);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'https://steelestimate.com',
    credentials: true,
  })
);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', v1AuthRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI missing');
      process.exit(1);
    }

    await connectDB();
    console.log('✅ MongoDB Connected');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup Error:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
