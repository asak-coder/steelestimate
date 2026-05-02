const User = require('../models/User');
const AppError = require('../utils/appError');
const {
  compactSession,
  compactLoginLog,
  detectSecurityEvents
} = require('../utils/securityAnalytics');

const getCurrentUser = (req) =>
  User.findById(req.user.id).select('+sessions +refreshToken loginLogs security');

const getSessions = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return res.status(200).json({
      success: true,
      data: (user.sessions || [])
        .map(compactSession)
        .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    });
  } catch (error) {
    return next(error);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const token = String(req.params.token || '');
    if (!token) {
      throw new AppError('Session token is required', 400);
    }

    const user = await getCurrentUser(req);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.sessions = (user.sessions || []).filter((session) => session.token !== token);
    if (user.refreshToken === token) {
      user.refreshToken = null;
    }
    await user.save();

    if (req.cookies?.refreshToken === token) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
    }

    return res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    return next(error);
  }
};

const getLoginLogs = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return res.status(200).json({
      success: true,
      data: (user.loginLogs || [])
        .map(compactLoginLog)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    });
  } catch (error) {
    return next(error);
  }
};

const getSecurityEvents = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return res.status(200).json({
      success: true,
      data: detectSecurityEvents(user)
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSessions,
  revokeSession,
  getLoginLogs,
  getSecurityEvents
};
