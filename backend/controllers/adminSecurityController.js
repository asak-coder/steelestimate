const mongoose = require('mongoose');
const LoginLog = require('../models/LoginLog');
const SecurityEvent = require('../models/SecurityEvent');

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const encodeCursor = (item) =>
  Buffer.from(JSON.stringify({ createdAt: item.createdAt, id: String(item._id) })).toString('base64url');

const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'));
    const createdAt = parseDate(parsed.createdAt);
    if (!createdAt || !mongoose.Types.ObjectId.isValid(parsed.id)) return null;
    return {
      createdAt,
      id: new mongoose.Types.ObjectId(parsed.id)
    };
  } catch (error) {
    return null;
  }
};

const addDateFilters = (query, source) => {
  const from = parseDate(source.from || source.startDate);
  const to = parseDate(source.to || source.endDate);
  if (!from && !to) return;
  query.createdAt = {};
  if (from) query.createdAt.$gte = from;
  if (to) query.createdAt.$lte = to;
};

const addCursorFilter = (query, cursor) => {
  const decoded = decodeCursor(cursor);
  if (!decoded) return;

  query.$or = [
    { createdAt: { $lt: decoded.createdAt } },
    {
      createdAt: decoded.createdAt,
      _id: { $lt: decoded.id }
    }
  ];
};

const buildEventQuery = (queryParams = {}) => {
  const query = {};
  addDateFilters(query, queryParams);
  if (queryParams.severity) query.severity = String(queryParams.severity).toUpperCase();
  if (queryParams.ip) query.ip = String(queryParams.ip);
  if (queryParams.type) query.type = String(queryParams.type).toUpperCase();
  addCursorFilter(query, queryParams.cursor);
  return query;
};

const buildLoginQuery = (queryParams = {}) => {
  const query = {};
  addDateFilters(query, queryParams);
  if (queryParams.ip) query.ip = String(queryParams.ip);
  if (queryParams.status) query.status = String(queryParams.status).toUpperCase();
  addCursorFilter(query, queryParams.cursor);
  return query;
};

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

const serializeLogin = (log) => ({
  id: String(log._id),
  userId: log.userId,
  email: log.email,
  ip: log.ip,
  userAgent: log.userAgent,
  status: log.status,
  reason: log.reason,
  geo: log.geo,
  createdAt: log.createdAt,
  timestamp: log.createdAt
});

const paginate = async ({ model, query, limit, serializer }) => {
  const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const rows = await model
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(pageSize + 1)
    .lean();
  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
  const last = pageRows[pageRows.length - 1];

  return {
    items: pageRows.map(serializer),
    pageInfo: {
      hasMore,
      nextCursor: hasMore && last ? encodeCursor(last) : null
    }
  };
};

const getSecurityEvents = async (req, res, next) => {
  try {
    const data = await paginate({
      model: SecurityEvent,
      query: buildEventQuery(req.query),
      limit: req.query.limit,
      serializer: serializeEvent
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const getSecurityLogins = async (req, res, next) => {
  try {
    const data = await paginate({
      model: LoginLog,
      query: buildLoginQuery(req.query),
      limit: req.query.limit,
      serializer: serializeLogin
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const getSecuritySummary = async (req, res, next) => {
  try {
    const loginQuery = buildLoginQuery(req.query);
    delete loginQuery.$or;
    const eventQuery = buildEventQuery(req.query);
    delete eventQuery.$or;

    const since = parseDate(req.query.from) || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [loginStatuses, eventSeverities, recentCritical, loginTimeline] = await Promise.all([
      LoginLog.aggregate([
        { $match: { ...loginQuery, createdAt: { ...(loginQuery.createdAt || {}), $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      SecurityEvent.aggregate([
        { $match: { ...eventQuery, createdAt: { ...(eventQuery.createdAt || {}), $gte: since } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      SecurityEvent.countDocuments({
        ...eventQuery,
        severity: { $in: ['HIGH', 'CRITICAL'] },
        createdAt: { ...(eventQuery.createdAt || {}), $gte: since }
      }),
      LoginLog.aggregate([
        { $match: { ...loginQuery, createdAt: { ...(loginQuery.createdAt || {}), $gte: since } } },
        {
          $group: {
            _id: {
              hour: {
                $dateTrunc: {
                  date: '$createdAt',
                  unit: 'hour'
                }
              },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.hour': 1 } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      data: {
        loginStatuses,
        eventSeverities,
        recentCritical,
        loginTimeline
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getSecurityLive = async (req, res, next) => {
  try {
    const events = await SecurityEvent.find({
      type: {
        $in: ['TOKEN_REUSE_DETECTED', 'MULTIPLE_FAILED_LOGINS', 'RAPID_IP_CHANGE', 'ACCOUNT_LOCKED', 'IMPOSSIBLE_TRAVEL']
      }
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        socketPath: '/socket.io',
        eventName: 'security:event',
        events: events.map(serializeEvent)
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSecurityEvents,
  getSecurityLogins,
  getSecuritySummary,
  getSecurityLive
};
