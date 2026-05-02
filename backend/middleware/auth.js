const { verifyAccessToken } = require('../services/jwtService');
const User = require('../models/User');

const sendAuthError = (res, message, statusCode = 401) =>
  res.status(statusCode).json({
    success: false,
    message
  });

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      return sendAuthError(res, 'Authorization token is required', 401);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('email role disabledAt twoFactorEnabled');

    if (!user || user.disabledAt) {
      return sendAuthError(res, 'Account is disabled or no longer exists', 401);
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      tokenIssuedAt: decoded.iat,
      tokenExpiresAt: decoded.exp
    };

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
