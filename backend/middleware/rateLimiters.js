const rateLimit = require('express-rate-limit');

const pebCalcLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many PEB calculation requests, please try again later'
  }
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin requests, please try again later'
  }
});

module.exports = {
  pebCalcLimiter,
  adminLimiter
};
