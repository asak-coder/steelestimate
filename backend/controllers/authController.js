const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const AppError = require('../utils/appError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../services/jwtService');
const { env } = require('../config/env');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_LOGIN_LOGS = 200;
const MAX_SESSIONS = 20;

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

if (env.NODE_ENV === 'production') {
  refreshCookieOptions.domain = '.steelestimate.com';
}

const sanitizeUser = (user) => ({
  id: String(user._id || user.id),
  name: user.name,
  email: user.email,
  role: user.role,
  twoFactorEnabled: Boolean(user.twoFactorEnabled)
});

const getRequestMeta = (req) => ({
  ip: req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '',
  userAgent: String(req.get('user-agent') || '').slice(0, 512)
});

const pushLoginLog = (user, status, meta) => {
  user.loginLogs.push({
    ip: meta.ip,
    userAgent: meta.userAgent,
    status,
    timestamp: new Date()
  });

  if (user.loginLogs.length > MAX_LOGIN_LOGS) {
    user.loginLogs = user.loginLogs.slice(-MAX_LOGIN_LOGS);
  }
};

const isLocked = (user) => {
  const lockUntil = user.security?.lockUntil;
  return lockUntil && lockUntil.getTime() > Date.now();
};

const recordFailedLogin = async (user, meta) => {
  user.security = user.security || {};
  user.security.failedAttempts = Number(user.security.failedAttempts || 0) + 1;

  if (user.security.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    user.security.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  pushLoginLog(user, 'FAILED', meta);
  await user.save();
};

const resetLoginSecurity = (user) => {
  user.security = {
    failedAttempts: 0,
    lockUntil: null
  };
};

const createPending2FAToken = (user) =>
  jwt.sign(
    {
      id: String(user._id),
      purpose: '2fa'
    },
    env.JWT_SECRET,
    {
      expiresIn: '5m',
      issuer: 'steelestimate-api',
      audience: 'steelestimate-admin'
    }
  );

const verifyPending2FAToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, {
    issuer: 'steelestimate-api',
    audience: 'steelestimate-admin'
  });

const issueSession = async (user, req, res) => {
  const meta = getRequestMeta(req);
  const sessionId = crypto.randomUUID();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, { sessionId });

  user.refreshToken = refreshToken;
  user.sessions.push({
    token: refreshToken,
    createdAt: new Date(),
    userAgent: meta.userAgent,
    ip: meta.ip,
    lastUsed: new Date()
  });

  if (user.sessions.length > MAX_SESSIONS) {
    user.sessions = user.sessions.slice(-MAX_SESSIONS);
  }

  resetLoginSecurity(user);
  pushLoginLog(user, 'SUCCESS', meta);
  await user.save();

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  return {
    accessToken,
    user: sanitizeUser(user)
  };
};

const findUserForAuth = (email) =>
  User.findOne({ email }).select('+password +refreshToken +sessions +twoFactorSecret');

const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const meta = getRequestMeta(req);

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await findUserForAuth(email);

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (isLocked(user)) {
      throw new AppError('Account is temporarily locked. Please try again later.', 423);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await recordFailedLogin(user, meta);
      throw new AppError('Invalid credentials', 401);
    }

    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        data: {
          requires2FA: true,
          twoFactorToken: createPending2FAToken(user)
        }
      });
    }

    const data = await issueSession(user, req, res);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return next(error);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const twoFactorToken = String(req.body.twoFactorToken || '');
    const otp = String(req.body.otp || req.body.token || '').replace(/\s+/g, '');

    if (!twoFactorToken || !otp) {
      throw new AppError('Two-factor token and OTP are required', 400);
    }

    const decoded = verifyPending2FAToken(twoFactorToken);
    if (decoded.purpose !== '2fa') {
      throw new AppError('Invalid two-factor verification token', 401);
    }

    const user = await User.findById(decoded.id).select('+sessions +twoFactorSecret +refreshToken');
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError('Two-factor authentication is not enabled', 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp,
      window: 1
    });

    if (!verified) {
      throw new AppError('Invalid two-factor code', 401);
    }

    const data = await issueSession(user, req, res);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new AppError('Refresh token is required', 401);
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken +sessions');

    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    const session = user.sessions.find((item) => item.token === token);
    const legacyMatch = user.refreshToken && user.refreshToken === token;

    if (!session && !legacyMatch) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (session) {
      session.lastUsed = new Date();
      await user.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        accessToken: signAccessToken(user),
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded.id).select('+refreshToken +sessions');
        if (user) {
          user.sessions = user.sessions.filter((item) => item.token !== token);
          if (user.refreshToken === token) {
            user.refreshToken = null;
          }
          await user.save();
        }
      } catch (error) {
        // clear cookie even when the refresh token is already invalid
      }
    }

    res.clearCookie('refreshToken', refreshCookieOptions);

    return res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    return next(error);
  }
};

const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const secret = speakeasy.generateSecret({
      name: `SteelEstimate (${user.email})`,
      issuer: 'SteelEstimate'
    });

    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false;
    await user.save();

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
        qrCodeDataUrl
      }
    });
  } catch (error) {
    return next(error);
  }
};

const enable2FA = async (req, res, next) => {
  try {
    const otp = String(req.body.otp || req.body.token || '').replace(/\s+/g, '');
    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (!user || !user.twoFactorSecret) {
      throw new AppError('Two-factor setup has not been started', 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp,
      window: 1
    });

    if (!verified) {
      throw new AppError('Invalid two-factor code', 401);
    }

    user.twoFactorEnabled = true;
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        twoFactorEnabled: true
      }
    });
  } catch (error) {
    return next(error);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const otp = String(req.body.otp || req.body.token || '').replace(/\s+/g, '');
    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError('Two-factor authentication is not enabled', 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp,
      window: 1
    });

    if (!verified) {
      throw new AppError('Invalid two-factor code', 401);
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        twoFactorEnabled: false
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  verify2FA,
  refreshToken,
  logout,
  setup2FA,
  enable2FA,
  disable2FA
};
