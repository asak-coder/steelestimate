const LoginLog = require('../models/LoginLog');
const AuthSession = require('../models/AuthSession');
const SecurityEvent = require('../models/SecurityEvent');

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const NO_DEDUPE_EVENT_TYPES = new Set(['TOKEN_REUSE_DETECTED', 'SESSION_REVOKED', '2FA_DISABLED']);

const createSecurityEvent = async ({ userId, type, severity, ip, userAgent, message, metadata = {} }) => {
  if (NO_DEDUPE_EVENT_TYPES.has(type)) {
    return SecurityEvent.create({
      userId,
      type,
      severity,
      ip: ip || '',
      userAgent: userAgent || '',
      message,
      metadata
    });
  }

  const since = new Date(Date.now() - ONE_HOUR_MS);
  const existing = await SecurityEvent.findOne({
    userId,
    type,
    ip: ip || '',
    createdAt: { $gte: since }
  }).select('_id');

  if (existing) {
    return existing;
  }

  return SecurityEvent.create({
    userId,
    type,
    severity,
    ip: ip || '',
    userAgent: userAgent || '',
    message,
    metadata
  });
};

const recordLoginLog = (payload) =>
  LoginLog.create({
    userId: payload.userId || null,
    email: payload.email || '',
    ip: payload.ip || '',
    userAgent: payload.userAgent || '',
    status: payload.status,
    reason: payload.reason || null
  });

const detectFailedLoginBurst = async ({ userId, email, ip, userAgent }) => {
  const since = new Date(Date.now() - FIFTEEN_MINUTES_MS);
  const failedCount = await LoginLog.countDocuments({
    email,
    status: 'FAILED',
    createdAt: { $gte: since }
  });

  if (failedCount >= 5) {
    await createSecurityEvent({
      userId,
      type: 'MULTIPLE_FAILED_LOGINS',
      severity: 'CRITICAL',
      ip,
      userAgent,
      message: `${failedCount} failed login attempts within 15 minutes`,
      metadata: {
        email,
        failedCount,
        windowMinutes: 15
      }
    });
  }
};

const detectSuccessfulLoginAnomalies = async ({ userId, ip, userAgent, deviceHash }) => {
  const now = Date.now();
  const oneHourAgo = new Date(now - ONE_HOUR_MS);
  const [previousSessionCount, previousSuccessCount] = await Promise.all([
    AuthSession.countDocuments({ userId }),
    LoginLog.countDocuments({ userId, status: 'SUCCESS' })
  ]);

  if (previousSessionCount === 0 && previousSuccessCount === 0) {
    return;
  }

  const previousIpSession = await AuthSession.findOne({
    userId,
    ip,
    revokedAt: null
  }).select('_id');

  if (!previousIpSession) {
    await createSecurityEvent({
      userId,
      type: 'NEW_IP_LOGIN',
      severity: 'LOW',
      ip,
      userAgent,
      message: 'Successful login from a new IP address',
      metadata: { ip }
    });
  }

  const recentIps = await LoginLog.distinct('ip', {
    userId,
    status: 'SUCCESS',
    createdAt: { $gte: oneHourAgo }
  });

  const uniqueRecentIps = [...new Set(recentIps.filter(Boolean))];
  if (ip && !uniqueRecentIps.includes(ip)) {
    uniqueRecentIps.push(ip);
  }

  if (uniqueRecentIps.length > 1) {
    await createSecurityEvent({
      userId,
      type: 'RAPID_IP_CHANGE',
      severity: 'HIGH',
      ip,
      userAgent,
      message: 'Successful logins from multiple IP addresses within one hour',
      metadata: {
        ips: uniqueRecentIps,
        windowMinutes: 60
      }
    });
  }

  const previousDevice = await AuthSession.findOne({
    userId,
    deviceHash,
    revokedAt: null
  }).select('_id');

  if (!previousDevice) {
    await createSecurityEvent({
      userId,
      type: 'UNUSUAL_USER_AGENT',
      severity: 'MEDIUM',
      ip,
      userAgent,
      message: 'Successful login from a new browser or device signature',
      metadata: { deviceHash }
    });
  }
};

module.exports = {
  createSecurityEvent,
  recordLoginLog,
  detectFailedLoginBurst,
  detectSuccessfulLoginAnomalies
};
