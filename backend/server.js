const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');
const securityMiddleware = require('./middleware/security');
const authRoutes = require('./routes/authRoutes');
const v1AuthRoutes = require('./routes/v1/authRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(securityMiddleware);

app.use(
  cors({
    origin: 'https://steelestimate.com',
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', v1AuthRoutes);

module.exports = app;