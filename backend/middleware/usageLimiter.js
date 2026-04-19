const UsageLog = require('../models/UsageLog');
const errorHandler = require('./errorHandler');

const AppError =
  typeof errorHandler.AppError === 'function'
    ? errorHandler.AppError
    : class AppError extends Error {
        constructor(message, statusCode = 500) {
          super(message);
          this.name = 'AppError';
          this.statusCode = statusCode;
          this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
          this.isOperational = true;
          Error.captureStackTrace?.(this, this.constructor);
        }
      };
const FREE_DAILY_LIMIT = 10;

function getUtcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getUserId(user) {
  if (!user) return null;
  return user.id || user._id || user.userId || null;
}

function getPlanType(user) {
  const raw = (user && (user.planType || user.plan || user.subscription?.plan || user.subscription?.planType)) || '';
  return String(raw || 'free').toLowerCase();
}

function isFreePlan(user) {
  const planType = getPlanType(user);
  if (!planType || planType === 'free') return true;
  const expiry = user && (user.planExpiry || user.subscription?.endDate || user.subscription?.expiresAt);
  if (!expiry) return false;
  const expiryDate = new Date(expiry);
  if (Number.isNaN(expiryDate.getTime())) return false;
  return expiryDate.getTime() <= Date.now();
}

async function getDailyCount(userId, action, usageDate) {
  const record = await UsageLog.findOne({ userId, usageDate, action }).lean();
  return record ? Number(record.count || 0) : 0;
}

async function incrementUsage(userId, action, usageDate, metadata = {}) {
  return UsageLog.findOneAndUpdate(
    { userId, usageDate, action },
    {
      $inc: { count: 1 },
      $setOnInsert: { metadata: metadata || {} },
      $set: { metadata: metadata || {} },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function trackUsage(action, options = {}) {
  const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : FREE_DAILY_LIMIT;
  const metadata = options.metadata || {};

  return async function usageLimiterMiddleware(req, res, next) {
    try {
      const user = req.user || {};
      const userId = getUserId(user);

      if (!userId) {
        return next(new AppError('Authentication required', 401));
      }

      const usageDate = getUtcDayKey();

      if (isFreePlan(user)) {
        const currentCount = await getDailyCount(userId, action, usageDate);
        if (currentCount >= limit) {
          return res.status(429).json({
            success: false,
            message: `You have reached the daily limit of ${limit} ${String(action).replace(/_/g, ' ')} for the free plan.`,
            limit,
            used: currentCount,
            remaining: 0,
          });
        }
      }

      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      let recorded = false;

      const recordIfSuccessful = async () => {
        if (recorded) return;
        recorded = true;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          await incrementUsage(userId, action, usageDate, {
            ...metadata,
            planType: getPlanType(user),
            path: req.originalUrl || req.url,
            method: req.method,
          });
        }
      };

      res.json = function patchedJson(body) {
        Promise.resolve(recordIfSuccessful()).catch(() => {});
        return originalJson(body);
      };

      res.send = function patchedSend(body) {
        Promise.resolve(recordIfSuccessful()).catch(() => {});
        return originalSend(body);
      };

      res.once('finish', () => {
        Promise.resolve(recordIfSuccessful()).catch(() => {});
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

const requireDailyUsageLimit = trackUsage;

module.exports = {
  FREE_DAILY_LIMIT,
  getUtcDayKey,
  trackUsage,
  requireDailyUsageLimit,
  incrementUsage,
  getDailyCount,
};