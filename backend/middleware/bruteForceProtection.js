const User = require('../models/User');
const BruteForceCounter = require('../models/BruteForceCounter');
const AppError = require('../utils/appError');

const bruteForceProtection = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = req.ip || (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : '') || req.socket?.remoteAddress || '';
    if (!email) {
      return next();
    }

    const keys = [`email:${email}`, `ip:${ip}`, `email_ip:${email}:${ip}`];
    const [user, counters] = await Promise.all([
      User.findOne({ email }).select('security disabledAt'),
      BruteForceCounter.find({
        key: { $in: keys },
        lockUntil: { $gt: new Date() }
      }).lean()
    ]);

    if (user?.disabledAt) {
      throw new AppError('Invalid credentials', 401);
    }

    const lockUntil = user?.security?.lockUntil;
    if ((lockUntil && lockUntil.getTime() > Date.now()) || counters.length > 0) {
      throw new AppError('Account is temporarily locked. Please try again later.', 423);
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  bruteForceProtection
};
