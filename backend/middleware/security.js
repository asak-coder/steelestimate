const helmet = require('helmet');

const securityMiddleware = helmet({
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
});

module.exports = securityMiddleware;