const User = require('../models/User');
const AppError = require('../utils/appError');

const bruteForceProtection = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) {
      return next();
    }

    const user = await User.findOne({ email }).select('security');
    const lockUntil = user?.security?.lockUntil;

    if (lockUntil && lockUntil.getTime() > Date.now()) {
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
