const errorHandler = require('./errorHandler');

const AppError = errorHandler.AppError || errorHandler;

function getPlanType(user) {
  const raw = (user && (user.planType || user.plan || user.subscription?.plan || user.subscription?.planType)) || '';
  return String(raw || 'free').toLowerCase();
}

function getPlanExpiry(user) {
  return user && (user.planExpiry || user.subscription?.endDate || user.subscription?.expiresAt || null);
}

function isPaidUser(user) {
  const planType = getPlanType(user);
  if (!planType || planType === 'free') return false;
  const expiry = getPlanExpiry(user);
  if (!expiry) return true;
  const expiryDate = new Date(expiry);
  if (Number.isNaN(expiryDate.getTime())) return true;
  return expiryDate.getTime() > Date.now();
}

function attachPlanFlags(req, res, next) {
  try {
    const paid = isPaidUser(req.user || {});
    req.featureFlags = {
      isPaid: paid,
      adsEnabled: !paid,
      canExportBoq: paid,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

function requirePaidPlan(req, res, next) {
  attachPlanFlags(req, res, (err) => {
    if (err) return next(err);
    if (!req.featureFlags || !req.featureFlags.isPaid) {
      return res.status(403).json({
        success: false,
        message: 'This feature is available on paid plans only.',
      });
    }
    return next();
  });
}

function requireBoqExportAccess(req, res, next) {
  return requirePaidPlan(req, res, next);
}

module.exports = {
  getPlanType,
  getPlanExpiry,
  isPaidUser,
  attachPlanFlags,
  requirePaidPlan,
  requireBoqExportAccess,
};