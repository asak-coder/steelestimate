let helmet;
try {
  helmet = require('helmet');
} catch (error) {
  helmet = null;
}

const securityMiddleware = helmet
  ? helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    })
  : (req, res, next) => next();

module.exports = securityMiddleware;
