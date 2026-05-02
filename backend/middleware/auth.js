const { verifyAccessToken } = require('../services/jwtService');
const AppError = require('../utils/appError');

const sendAuthError = (res, message, statusCode = 401) =>
  res.status(statusCode).json({
    success: false,
    message
  });

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      return sendAuthError(res, 'Authorization token is required', 401);
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;

    return next();
  } catch (error) {
    return sendAuthError(res, 'Invalid or expired token', 401);
  }
};

const requireAuth = verifyToken;

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return sendAuthError(res, 'Authentication required', 401);
  }

  if (String(req.user.role || '').toLowerCase() !== 'admin') {
    return sendAuthError(res, 'Admin access required', 403);
  }

  return next();
};

module.exports = {
  verifyToken,
  requireAuth,
  requireAdmin
};
