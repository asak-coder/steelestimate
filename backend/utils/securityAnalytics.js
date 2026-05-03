const LoginLog = require('../models/LoginLog');
const AuthSession = require('../models/AuthSession');
const SecurityEvent = require('../models/SecurityEvent');
const { distanceKm } = require('../services/geoIpService');
const { blockIp } = require('../services/cloudflareService');
const { emitSecurityEvent } = require('../services/securityRealtime');

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const NO_DEDUPE_EVENT_TYPES = new Set(['TOKEN_REUSE_DETECTED', 'SESSION_REVOKED', '2FA_DISABLED', 'IMPOSSIBLE_TRAVEL']);
const LIVE_EVENT_TYPES = new Set(['TOKEN_REUSE_DETECTED', 'MULTIPLE_FAILED_LOGINS', 'RAPID_IP_CHANGE', 'ACCOUNT_LOCKED', 'IMPOSSIBLE_TRAVEL']);
const AUTO_BLOCK_EVENT_TYPES = new Set(['TOKEN_REUSE_DETECTED', 'MULTIPLE_FAILED_LOGINS', 'ACCOUNT_LOCKED', 'IMPOSSIBLE_TRAVEL']);

const serializeEvent = (event) => ({
  id: String(event._id),
  userId: event.userId,
  type: event.type,
  severity: event.severity,
  ip: event.ip,
  userAgent: event.userAgent,
  message: event.message,
  metadata: event.metadata,
  acknowledgedAt: event.acknowledgedAt,
  createdAt: event.createdAt,
  lastSeen: event.createdAt
});

const afterSecurityEventCreated = async (event) => {
  const payload = serializeEvent(event);

  if (LIVE_EVENT_TYPES.has(event.type)) {
    emitSecurityEvent(payload);
  }

  if (AUTO_BLOCK_EVENT_TYPES.has(event.type) && ['HIGH', 'CRITICAL'].includes(event.severity)) {
    try {
      await blockIp({ ip: event.ip, reason: `${event.type}: ${event.message}` });
    } catch (error) {
      await SecurityEvent.create({
        userId: event.userId,
        type: 'CLOUDFLARE_BLOCK_FAILED',
        severity: 'MEDIUM',
        ip: event.ip || '',
        userAgent: event.userAgent || '',
        message: 'Cloudflare IP block request failed',
        metadata: {
          sourceEventId: String(event._id),
          error: error.message
        }
      }).catch(() => null);
    }
  }

  return event;
};

const createEventDocument = async ({ userId, type, severity, ip, userAgent, message, metadata = {} }) => {
  const event = await SecurityEvent.create({
    userId,
    type,
    severity,
    ip: ip || '',
    userAgent: userAgent || '',
    message,
    metadata
  });

  return afterSecurityEventCreated(event);
};

const createSecurityEvent = async ({ userId, type, severity, ip, userAgent, message, metadata = {} }) => {
  if (NO_DEDUPE_EVENT_TYPES.has(type)) {
    return createEventDocument({ userId, type, severity, ip, userAgent, message, metadata });
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

  return createEventDocument({ userId, type, severity, ip, userAgent, message, metadata });
};

const recordLoginLog = (payload) =>
  LoginLog.create({
    userId: payload.userId || null,
    email: payload.email || '',
    ip: payload.ip || '',
    userAgent: payload.userAgent || '',
    status: payload.status,
    reason: payload.reason || null,
    geo: payload.geo || undefined
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

const detectGeoAnomalies = async ({ userId, ip, userAgent, geo }) => {
  if (!geo?.country) return;

  const previousCountry = await LoginLog.findOne({
    userId,
    status: 'SUCCESS',
    'geo.country': geo.country
  }).select('_id');

  if (!previousCountry) {
    await createSecurityEvent({
      userId,
      type: 'NEW_COUNTRY_LOGIN',
      severity: 'HIGH',
      ip,
      userAgent,
      message: `Successful login from new country ${geo.country}`,
      metadata: { geo }
    });
  }

  if (geo.city) {
    const previousCity = await LoginLog.findOne({
      userId,
      status: 'SUCCESS',
      'geo.country': geo.country,
      'geo.city': geo.city
    }).select('_id');

    if (!previousCity) {
      await createSecurityEvent({
        userId,
        type: 'NEW_CITY_LOGIN',
        severity: 'LOW',
        ip,
        userAgent,
        message: `Successful login from new city ${geo.city}`,
        metadata: { geo }
      });
    }
  }

  const recentDifferentLocation = await LoginLog.findOne({
    userId,
    status: 'SUCCESS',
    createdAt: { $gte: new Date(Date.now() - ONE_HOUR_MS) },
    ip: { $ne: ip },
    'geo.latitude': { $type: 'number' },
    'geo.longitude': { $type: 'number' }
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!recentDifferentLocation) return;

  const km = distanceKm(recentDifferentLocation.geo, geo);
  if (!km) return;

  const minutes = Math.max((Date.now() - new Date(recentDifferentLocation.createdAt).getTime()) / 60000, 1);
  const speedKmh = km / (minutes / 60);
  const metadata = {
    currentGeo: geo,
    previousGeo: recentDifferentLocation.geo,
    distanceKm: Math.round(km),
    minutes: Math.round(minutes),
    speedKmh: Math.round(speedKmh)
  };

  if (speedKmh > 900) {
    await createSecurityEvent({
      userId,
      type: 'IMPOSSIBLE_TRAVEL',
      severity: 'CRITICAL',
      ip,
      userAgent,
      message: 'Impossible travel detected between successful logins',
      metadata
    });
  } else if (km > 500) {
    await createSecurityEvent({
      userId,
      type: 'RAPID_LOCATION_CHANGE',
      severity: 'HIGH',
      ip,
      userAgent,
      message: 'Rapid location change detected between successful logins',
      metadata
    });
  }
};

const detectSuccessfulLoginAnomalies = async ({ userId, ip, userAgent, deviceHash, geo }) => {
  const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
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
      metadata: { ip, geo }
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
        windowMinutes: 60,
        geo
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
      metadata: { deviceHash, geo }
    });
  }

  await detectGeoAnomalies({ userId, ip, userAgent, geo });
};

module.exports = {
  createSecurityEvent,
  recordLoginLog,
  detectFailedLoginBurst,
  detectSuccessfulLoginAnomalies,
  serializeEvent
};
