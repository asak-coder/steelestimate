const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function requireAuth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const role = String(req.user.role || req.user.userRole || '').toLowerCase();
  const isAdmin =
    role === 'admin' ||
    role === 'superadmin' ||
    req.user.isAdmin === true ||
    req.user.admin === true ||
    req.user.isAdmin === 'true';

  if (!isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;
module.exports.authMiddleware = requireAuth;
module.exports.protectRoute = requireAuth;
