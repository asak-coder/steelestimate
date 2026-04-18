const rateLimit = require("express-rate-limit");

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false
};

const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication requests, please try again later"
  }
});

const adminLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many admin requests, please try again later"
  }
});

const sensitiveLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many requests, please try again later"
  }
});

const pebCalcLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many PEB calculation requests, please try again later"
  }
});

module.exports = {
  authLimiter,
  adminLimiter,
  sensitiveLimiter,
  pebCalcLimiter
};
