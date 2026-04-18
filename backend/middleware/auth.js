const AppError = require("../utils/appError");
const { verifyToken } = require("../services/jwtService");

const normalizeRole = (role) => String(role || "").toUpperCase();

const getTokenFromRequest = (req) => {
  if (req.cookies && req.cookies.authToken) {
    return req.cookies.authToken;
  }

  return null;
};

const requireAuth = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id || decoded.sub,
      role: normalizeRole(decoded.role)
    };

    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

const requireRole = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!normalizedAllowedRoles.includes(normalizeRole(req.user.role))) {
      return next(new AppError("Insufficient permissions", 403));
    }

    return next();
  };
};

const requireAdmin = requireRole("ADMIN");
const requireAdminOrManager = requireRole("ADMIN", "MANAGER");
const requireViewer = requireRole("ADMIN", "MANAGER", "VIEWER");

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireAdminOrManager,
  requireViewer
};
