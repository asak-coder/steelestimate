const express = require('express');
const pebRoutes = require('./routes/pebRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(express.json());
app.use('/api/peb', pebRoutes);
app.use('/api/payments', paymentRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;