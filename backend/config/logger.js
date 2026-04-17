const morgan = require('morgan');

const requestLogger = morgan('combined');

const errorLogger = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  next(err);
};

module.exports = {
  requestLogger,
  errorLogger
};
