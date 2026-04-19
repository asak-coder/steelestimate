process.env.MONGO_URI = 'x';
process.env.JWT_SECRET = 'y';
process.env.CORS_ORIGIN = 'https://steelestimate.com';

const s = require('./backend/middleware/security');
console.log(JSON.stringify({
  allowedOrigins: s.allowedOrigins,
  middlewareTypes: s.securityMiddleware.map((m) => typeof m)
}, null, 2));
