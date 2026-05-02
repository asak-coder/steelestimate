const AuthSession = require('../models/AuthSession');
const LoginLog = require('../models/LoginLog');
const SecurityEvent = require('../models/SecurityEvent');
const AppError = require('../utils/appError');
const { createSecurityEvent } = require('../utils/securityAnalytics');

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildDateRange = (query) => {
  const range = {};
  const from = parseDate(query.from || query.startDate);
  const to = parseDate(query.to || query.endDate);

  if (from) range.$gte = from;
  if (to) range.$lte = to;

  return Object.keys(range).length > 0 ? range : null;
};

const compactSession = (session) => ({
  id: session.refreshTokenId,
  refreshTokenId: session.refreshTokenId,
  ip: session.ip,
  userAgent: session.userAgent,
  deviceHash: session.deviceHash,
  createdAt: session.createdAt,
  lastUsedAt: session.lastUsedAt,
  expiresAt: session.expiresAt,
  revokedAt: session.revokedAt,
  revokedReason: session.revokedReason
});

const getSessions = async (req, res, next) => {
  try {
    const sessions = await AuthSession.find({
      userId: req.user.id,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    })
      .sort({ lastUsedAt: -1 })
      .select('-refreshTokenHash')
      .lean();

    return res.status(200).json({
      success: true,
      data: sessions.map(compactSession)
    });
  } catch (error) {
    return next(error);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const refreshTokenId = String(req.params.token || req.params.refreshTokenId || '');
    if (!refreshTokenId) {
      throw new AppError('Session id is required', 400);
    }

    const result = await AuthSession.updateOne(
      {
        userId: req.user.id,
        refreshTokenId,
        revokedAt: null
      },
      {
        $set: {
          revokedAt: new Date(),
          revokedReason: 'ADMIN_REVOKED'
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new AppError('Session not found', 404);
    }

    await createSecurityEvent({
      userId: req.user.id,
      type: 'SESSION_REVOKED',
      severity: 'LOW',
      ip: req.ip || '',
      userAgent: String(req.get('user-agent') || ''),
      message: 'Admin revoked an active session',
      metadata: {
        refreshTokenId
      }
    });

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
    const query = { userId: req.user.id };
    const createdAt = buildDateRange(req.query);
    if (createdAt) query.createdAt = createdAt;
    if (req.query.ip) query.ip = String(req.query.ip);
    if (req.query.status) query.status = String(req.query.status).toUpperCase();

    const logs = await LoginLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 100, 500))
      .lean();

    return res.status(200).json({
      success: true,
      data: logs.map((log) => ({
        id: String(log._id),
        userId: log.userId,
        email: log.email,
        ip: log.ip,
        userAgent: log.userAgent,
        status: log.status,
        reason: log.reason,
        createdAt: log.createdAt,
        timestamp: log.createdAt
      }))
    });
  } catch (error) {
    return next(error);
  }
};

const getSecurityEvents = async (req, res, next) => {
  try {
    const query = { userId: req.user.id };
    const createdAt = buildDateRange(req.query);
    if (createdAt) query.createdAt = createdAt;
    if (req.query.ip) query.ip = String(req.query.ip);
    if (req.query.severity) query.severity = String(req.query.severity).toUpperCase();
    if (req.query.type) query.type = String(req.query.type).toUpperCase();

    const events = await SecurityEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 100, 500))
      .lean();

    return res.status(200).json({
      success: true,
      data: events.map((event) => ({
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
      }))
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
