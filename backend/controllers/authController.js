const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const qrcode = require('qrcode');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const BruteForceCounter = require('../models/BruteForceCounter');
const AppError = require('../utils/appError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../services/jwtService');
const { hashDevice, hashToken } = require('../utils/authTokens');
const {
  createSecurityEvent,
  detectFailedLoginBurst,
  detectSuccessfulLoginAnomalies,
  recordLoginLog
} = require('../utils/securityAnalytics');
const { env } = require('../config/env');
const { enrichIp } = require('../services/geoIpService');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const BRUTE_COUNTER_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH = '$2a$12$YCeRgp3RihOxs0rUeM6hke/FYrApWE6jcYKNUqdrq1Tw46HL2eR8K';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: REFRESH_TOKEN_TTL_MS
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

const getRequestMeta = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = req.ip || (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : '') || req.socket?.remoteAddress || '';
  const userAgent = String(req.get('user-agent') || '').slice(0, 512);

  return {
    ip,
    userAgent,
    deviceHash: hashDevice({ ip, userAgent })
  };
};

const isLocked = (user) => {
  const lockUntil = user?.security?.lockUntil;
  return Boolean(lockUntil && lockUntil.getTime() > Date.now());
};

const bruteKeysFor = ({ email, ip }) => [
  `email:${email}`,
  `ip:${ip}`,
  `email_ip:${email}:${ip}`
];

const twoFactorKeysFor = ({ userId, ip }) => [
  `2fa:${userId}`,
  `2fa_ip:${userId}:${ip}`
];

const getActiveCounterLock = async (keys) =>
  BruteForceCounter.findOne({
    key: { $in: keys },
    lockUntil: { $gt: new Date() }
  }).lean();

const incrementCounterKeys = async (keys, explicitLockUntil = null) => {
  const now = new Date();
  const expiresAt = new Date(Date.now() + BRUTE_COUNTER_TTL_MS);

  await Promise.all(
    keys.map((key) =>
      BruteForceCounter.updateOne(
        { key },
        {
          $inc: { attempts: 1 },
          $set: {
            lastAttemptAt: now,
            expiresAt,
            ...(explicitLockUntil ? { lockUntil: explicitLockUntil } : {})
          },
          $setOnInsert: {
            firstAttemptAt: now
          }
        },
        { upsert: true }
      )
    )
  );

  const counters = await BruteForceCounter.find({ key: { $in: keys } }).lean();
  const maxAttempts = counters.reduce((max, counter) => Math.max(max, Number(counter.attempts || 0)), 0);
  let lockUntil = explicitLockUntil;

  if (!lockUntil && maxAttempts >= MAX_FAILED_ATTEMPTS) {
    lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    await BruteForceCounter.updateMany(
      { key: { $in: keys } },
      {
        $set: {
          lockUntil,
          expiresAt: new Date(Date.now() + BRUTE_COUNTER_TTL_MS)
        }
      }
    );
  }

  return {
    maxAttempts,
    lockUntil
  };
};

const incrementBruteForceCounters = ({ email, ip, lockUntil = null }) =>
  incrementCounterKeys(bruteKeysFor({ email, ip }), lockUntil);

const clearBruteForceCounters = async ({ email, ip }) => {
  await BruteForceCounter.deleteMany({
    key: { $in: bruteKeysFor({ email, ip }) }
  });
};

const clearTwoFactorCounters = async ({ userId, ip }) => {
  await BruteForceCounter.deleteMany({
    key: { $in: twoFactorKeysFor({ userId, ip }) }
  });
};

const revokeAllUserSessions = async ({ userId, reason, session = null }) =>
  AuthSession.updateMany(
    {
      userId,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    },
    session ? { session } : undefined
  );

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

const buildRefreshSession = ({ user, meta }) => {
  const refreshTokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user, { refreshTokenId });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    refreshTokenId,
    sessionDocument: {
      userId: user._id,
      refreshTokenId,
      refreshTokenHash: hashToken(refreshToken),
      ip: meta.ip,
      userAgent: meta.userAgent,
      deviceHash: meta.deviceHash,
      geo: meta.geo || undefined,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    }
  };
};

const createSessionTokens = async ({ user, meta }) => {
  const tokens = buildRefreshSession({ user, meta });
  await AuthSession.create(tokens.sessionDocument);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    refreshTokenId: tokens.refreshTokenId
  };
};

const sendRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};

const findUserForAuth = (email) =>
  User.findOne({ email }).select('+password +twoFactorSecret');

const completeLogin = async ({ user, req, res, status = 'SUCCESS' }) => {
  const meta = getRequestMeta(req);
  meta.geo = await enrichIp(meta.ip);
  await detectSuccessfulLoginAnomalies({
    userId: user._id,
    ip: meta.ip,
    userAgent: meta.userAgent,
    deviceHash: meta.deviceHash,
    geo: meta.geo
  });
  const tokens = await createSessionTokens({ user, meta });

  user.security = {
    ...(user.security || {}),
    failedAttempts: 0,
    lockUntil: null,
    lastLoginAt: new Date(),
    lastLoginIp: meta.ip
  };
  await user.save();

  await clearBruteForceCounters({ email: user.email, ip: meta.ip });
  await clearTwoFactorCounters({ userId: String(user._id), ip: meta.ip });
  await recordLoginLog({
    userId: user._id,
    email: user.email,
    ip: meta.ip,
    userAgent: meta.userAgent,
    status,
    geo: meta.geo
  });

  sendRefreshCookie(res, tokens.refreshToken);

  return {
    accessToken: tokens.accessToken,
    user: sanitizeUser(user)
  };
};

const recordFailedLogin = async ({ user, email, meta, reason = 'INVALID_CREDENTIALS' }) => {
  meta.geo = meta.geo || (await enrichIp(meta.ip));
  let lockUntil = null;

  if (user) {
    user.security = user.security || {};
    user.security.failedAttempts = Number(user.security.failedAttempts || 0) + 1;
    user.security.lastFailedAt = new Date();

    if (user.security.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.security.lockUntil = lockUntil;
    }

    await user.save();
  }

  const counterState = await incrementBruteForceCounters({ email, ip: meta.ip, lockUntil });
  lockUntil = lockUntil || counterState.lockUntil;

  await recordLoginLog({
    userId: user?._id || null,
    email,
    ip: meta.ip,
    userAgent: meta.userAgent,
    status: lockUntil ? 'LOCKED' : 'FAILED',
    reason,
    geo: meta.geo
  });
  await detectFailedLoginBurst({
    userId: user?._id || null,
    email,
    ip: meta.ip,
    userAgent: meta.userAgent
  });

  if (lockUntil) {
    await createSecurityEvent({
      userId: user?._id || null,
      type: 'ACCOUNT_LOCKED',
      severity: 'CRITICAL',
      ip: meta.ip,
      userAgent: meta.userAgent,
      message: 'Authentication locked after repeated failed login attempts',
      metadata: {
        email,
        failedAttempts: user?.security?.failedAttempts || counterState.maxAttempts,
        lockUntil
      }
    });
  }
};

const recordTwoFactorFailure = async ({ user, meta }) => {
  meta.geo = meta.geo || (await enrichIp(meta.ip));
  const counterState = await incrementCounterKeys(twoFactorKeysFor({ userId: String(user._id), ip: meta.ip }));
  let lockUntil = counterState.lockUntil;

  if (lockUntil) {
    user.security = {
      ...(user.security || {}),
      failedAttempts: Math.max(Number(user.security?.failedAttempts || 0), MAX_FAILED_ATTEMPTS),
      lockUntil
    };
    await user.save();
    await createSecurityEvent({
      userId: user._id,
      type: 'ACCOUNT_LOCKED',
      severity: 'CRITICAL',
      ip: meta.ip,
      userAgent: meta.userAgent,
      message: 'Account locked after repeated invalid two-factor attempts',
      metadata: {
        failedAttempts: counterState.maxAttempts,
        lockUntil
      }
    });
  }

  await recordLoginLog({
    userId: user._id,
    email: user.email,
    ip: meta.ip,
    userAgent: meta.userAgent,
    status: '2FA_FAILED',
    reason: lockUntil ? '2FA_LOCKED' : 'INVALID_OTP',
    geo: meta.geo
  });
};

const handleRefreshCompromise = async ({ session, refreshTokenId, meta, reason }) => {
  await revokeAllUserSessions({
    userId: session.userId,
    reason
  });
  await createSecurityEvent({
    userId: session.userId,
    type: 'TOKEN_REUSE_DETECTED',
    severity: 'CRITICAL',
    ip: meta.ip,
    userAgent: meta.userAgent,
    message: 'Refresh token reuse or mismatch detected; all sessions revoked',
    metadata: {
      refreshTokenId,
      reason
    }
  });
};

const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const meta = getRequestMeta(req);

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await findUserForAuth(email);

    if (!user || user.disabledAt) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      await recordFailedLogin({ user: null, email, meta, reason: 'INVALID_CREDENTIALS' });
      throw new AppError('Invalid credentials', 401);
    }

    if (isLocked(user)) {
      await recordLoginLog({
        userId: user._id,
        email,
        ip: meta.ip,
        userAgent: meta.userAgent,
        status: 'LOCKED',
        reason: 'ACCOUNT_LOCKED'
      });
      throw new AppError('Account is temporarily locked. Please try again later.', 423);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await recordFailedLogin({ user, email, meta });
      throw new AppError('Invalid credentials', 401);
    }

    if (user.twoFactorEnabled) {
      await recordLoginLog({
        userId: user._id,
        email,
        ip: meta.ip,
        userAgent: meta.userAgent,
        status: '2FA_REQUIRED'
      });

      return res.status(200).json({
        success: true,
        data: {
          requires2FA: true,
          twoFactorToken: createPending2FAToken(user)
        }
      });
    }

    const data = await completeLogin({ user, req, res });

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
    const meta = getRequestMeta(req);

    if (!twoFactorToken || !otp) {
      throw new AppError('Two-factor token and OTP are required', 400);
    }

    const decoded = verifyPending2FAToken(twoFactorToken);
    if (decoded.purpose !== '2fa') {
      throw new AppError('Invalid two-factor verification token', 401);
    }

    const user = await User.findById(decoded.id).select('+twoFactorSecret');
    if (!user || user.disabledAt || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError('Two-factor authentication is not enabled', 400);
    }

    if (isLocked(user) || (await getActiveCounterLock(twoFactorKeysFor({ userId: String(user._id), ip: meta.ip })))) {
      await recordLoginLog({
        userId: user._id,
        email: user.email,
        ip: meta.ip,
        userAgent: meta.userAgent,
        status: 'LOCKED',
        reason: '2FA_LOCKED'
      });
      throw new AppError('Account is temporarily locked. Please try again later.', 423);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp,
      window: 1
    });

    if (!verified) {
      await recordTwoFactorFailure({ user, meta });
      throw new AppError('Invalid two-factor code', 401);
    }

    const data = await completeLogin({ user, req, res });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return next(error);
  }
};

const refreshToken = async (req, res, next) => {
  const mongoSession = await mongoose.startSession();

  try {
    const token = req.cookies?.refreshToken;
    const meta = getRequestMeta(req);

    if (!token) {
      throw new AppError('Refresh token is required', 401);
    }

    const decoded = verifyRefreshToken(token);
    const refreshTokenId = decoded.refreshTokenId;

    if (!refreshTokenId) {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokenHash = hashToken(token);
    const session = await AuthSession.findOne({ refreshTokenId }).select('+refreshTokenHash');

    if (!session) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (session.revokedAt) {
      await handleRefreshCompromise({
        session,
        refreshTokenId,
        meta,
        reason: 'REVOKED_TOKEN_REUSE'
      });
      throw new AppError('Invalid refresh token', 401);
    }

    if (session.expiresAt <= new Date()) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (session.refreshTokenHash !== tokenHash) {
      await handleRefreshCompromise({
        session,
        refreshTokenId,
        meta,
        reason: 'REFRESH_TOKEN_HASH_MISMATCH'
      });
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await User.findById(session.userId);
    if (!user || user.disabledAt) {
      throw new AppError('Invalid refresh token', 401);
    }

    meta.geo = await enrichIp(meta.ip);
    const tokens = buildRefreshSession({ user, meta });

    await mongoSession.withTransaction(async () => {
      const rotation = await AuthSession.updateOne(
        {
          refreshTokenId,
          refreshTokenHash: tokenHash,
          revokedAt: null,
          expiresAt: { $gt: new Date() }
        },
        {
          $set: {
            revokedAt: new Date(),
            revokedReason: 'ROTATED'
          }
        },
        { session: mongoSession }
      );

      if (rotation.modifiedCount !== 1) {
        throw new AppError('Invalid refresh token', 401);
      }

      await AuthSession.create([tokens.sessionDocument], { session: mongoSession });
    });

    sendRefreshCookie(res, tokens.refreshToken);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    return next(error);
  } finally {
    await mongoSession.endSession();
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        if (decoded.refreshTokenId) {
          await AuthSession.updateOne(
            {
              refreshTokenId: decoded.refreshTokenId,
              revokedAt: null
            },
            {
              $set: {
                revokedAt: new Date(),
                revokedReason: 'LOGOUT'
              }
            }
          );
        }
      } catch (error) {
        // clear cookie even when the refresh token is malformed or expired
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
    if (!user || user.disabledAt) {
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
    const meta = getRequestMeta(req);
    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (!user || user.disabledAt || !user.twoFactorSecret) {
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
    await createSecurityEvent({
      userId: user._id,
      type: '2FA_ENABLED',
      severity: 'LOW',
      ip: meta.ip,
      userAgent: meta.userAgent,
      message: 'Two-factor authentication enabled',
      metadata: {}
    });

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
    const password = String(req.body.password || '');
    const meta = getRequestMeta(req);
    const user = await User.findById(req.user.id).select('+twoFactorSecret +password');

    if (!user || user.disabledAt || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError('Two-factor authentication is not enabled', 400);
    }

    if (!password) {
      throw new AppError('Password is required to disable two-factor authentication', 400);
    }

    const passwordValid = await user.comparePassword(password);
    if (!passwordValid) {
      throw new AppError('Invalid password', 401);
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
    await createSecurityEvent({
      userId: user._id,
      type: '2FA_DISABLED',
      severity: 'MEDIUM',
      ip: meta.ip,
      userAgent: meta.userAgent,
      message: 'Two-factor authentication disabled',
      metadata: {}
    });

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
