const User = require('../models/User');
const Lead = require('../models/Lead');

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(offsetDays = 0) {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  date.setUTCDate(date.getUTCDate() - offsetDays);
  return date;
}

function buildDateBuckets(days) {
  const buckets = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = startOfUtcDay(i);
    buckets.push(toDateKey(date));
  }
  return buckets;
}

function numericValue(value) {
  if (value == null) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object') {
    const candidates = [
      value.amount,
      value.value,
      value.total,
      value.cost,
      value.price,
      value.revenue,
      value.optimizedPrice,
      value.estimatedCost,
    ];
    for (const candidate of candidates) {
      const resolved = numericValue(candidate);
      if (resolved) return resolved;
    }
    if (typeof value.valueOf === 'function') {
      const resolved = Number(value.valueOf());
      if (Number.isFinite(resolved)) return resolved;
    }
  }
  const fallback = Number(value);
  return Number.isFinite(fallback) ? fallback : 0;
}

function safeString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    if (typeof value.label === 'string') return value.label.trim();
    if (typeof value.name === 'string') return value.name.trim();
    if (typeof value.title === 'string') return value.title.trim();
    if (typeof value.text === 'string') return value.text.trim();
  }
  return String(value).trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const resolved = safeString(value);
    if (resolved) return resolved;
  }
  return '';
}

function getNameFromUser(user) {
  return firstNonEmpty(
    user?.name,
    user?.fullName,
    user?.displayName,
    user?.profile?.name,
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    user?.firstName,
    user?.email
  ) || 'Unknown';
}

function getPlanTypeFromUser(user) {
  return firstNonEmpty(user?.planType, user?.subscription?.planType, user?.subscription?.tier, user?.subscription?.type);
}

function getPlanExpiryFromUser(user) {
  return user?.planExpiry || user?.subscription?.endDate || user?.subscription?.expiryDate || null;
}

function getSubscriptionStartFromUser(user) {
  return user?.subscription?.startDate || user?.subscription?.beginDate || user?.createdAt || null;
}

function isFutureDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function isActiveUser(user) {
  const subscription = user?.subscription || {};
  const planType = getPlanTypeFromUser(user).toLowerCase();
  if (subscription?.premium === true) return true;
  if (subscription?.premium === 'true') return true;
  if (planType && !['free', 'none', 'trial'].includes(planType)) return true;
  if (isFutureDate(getPlanExpiryFromUser(user))) return true;
  return false;
}

function getLeadName(lead) {
  return firstNonEmpty(lead?.name, lead?.clientName, lead?.customerName, lead?.contactName, lead?.fullName) || 'Unknown';
}

function getLeadPhone(lead) {
  return firstNonEmpty(lead?.phone, lead?.mobile, lead?.contactPhone, lead?.whatsapp, lead?.mobileNumber, lead?.phoneNumber);
}

function getLeadProject(lead) {
  return firstNonEmpty(lead?.project, lead?.projectType, lead?.projectName, lead?.type, lead?.description) || 'N/A';
}

function getLeadEstimatedCost(lead) {
  const optimized = numericValue(lead?.optimizedPrice);
  if (optimized) return optimized;
  const cost = numericValue(lead?.cost);
  if (cost) return cost;
  return numericValue(lead?.estimatedCost);
}

function getLeadCreatedAt(lead) {
  return lead?.createdAt || lead?.updatedAt || lead?.submittedAt || null;
}

function formatDateKey(date) {
  const key = toDateKey(date);
  return key || '';
}

function bucketRowsByDate(rows, days, valueResolver) {
  const keys = buildDateBuckets(days);
  const bucketMap = new Map(keys.map((key) => [key, 0]));
  rows.forEach((row) => {
    const key = formatDateKey(row?.createdAt);
    if (!key || !bucketMap.has(key)) return;
    bucketMap.set(key, bucketMap.get(key) + valueResolver(row));
  });
  return keys.map((date) => ({ date, value: bucketMap.get(date) || 0 }));
}

function bucketRevenueByDate(rows, days) {
  const keys = buildDateBuckets(days);
  const bucketMap = new Map(keys.map((key) => [key, 0]));
  rows.forEach((row) => {
    const key = formatDateKey(row?.createdAt);
    if (!key || !bucketMap.has(key)) return;
    bucketMap.set(key, bucketMap.get(key) + getLeadEstimatedCost(row));
  });
  return keys.map((date) => ({ date, revenue: bucketMap.get(date) || 0 }));
}

async function getAdminStats(req, res, next) {
  try {
    const revenueFields = 'optimizedPrice cost createdAt';
    const leadFields = 'createdAt';
    const [totalUsers, totalLeads, leadRevenueDocs, recentUsageDocs, recentRevenueDocs, userDocs] = await Promise.all([
      User.countDocuments({}),
      Lead.countDocuments({}),
      Lead.find({}, revenueFields).lean(),
      Lead.find({ createdAt: { $gte: startOfUtcDay(6) } }, leadFields).lean(),
      Lead.find({ createdAt: { $gte: startOfUtcDay(29) } }, revenueFields).lean(),
      User.find({}, 'planType planExpiry createdAt subscription premium name email role').lean(),
    ]);

    const totalRevenue = leadRevenueDocs.reduce((sum, lead) => sum + getLeadEstimatedCost(lead), 0);
    const activeUsers = userDocs.reduce((count, user) => count + (isActiveUser(user) ? 1 : 0), 0);

    const dailyUsage = bucketRowsByDate(recentUsageDocs, 7, () => 1);
    const revenueChart = bucketRevenueByDate(recentRevenueDocs, 30);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalLeads,
        totalRevenue,
        activeUsers,
        dailyUsage,
        revenueChart,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminUsers(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({}, 'name email role planType planExpiry createdAt subscription premium')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({}),
    ]);

    const rows = users.map((user) => ({
      id: String(user._id),
      name: getNameFromUser(user),
      email: safeString(user.email),
      role: safeString(user.role) || 'user',
      planType: getPlanTypeFromUser(user) || 'free',
      planExpiry: getPlanExpiryFromUser(user),
      status: isActiveUser(user) ? 'active' : 'inactive',
      createdAt: user.createdAt,
    }));

    res.json({
      success: true,
      data: {
        users: rows,
        rows,
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminLeads(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find({}, 'name clientName customerName contactName fullName phone mobile contactPhone whatsapp mobileNumber phoneNumber project projectType projectName type description optimizedPrice cost estimatedCost createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments({}),
    ]);

    const rows = leads.map((lead) => ({
      id: String(lead._id),
      name: getLeadName(lead),
      phone: getLeadPhone(lead),
      project: getLeadProject(lead),
      estimatedCost: getLeadEstimatedCost(lead),
      createdAt: getLeadCreatedAt(lead),
    }));

    res.json({
      success: true,
      data: {
        leads: rows,
        rows,
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminSubscriptions(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);

    const users = await User.find({}, 'name email role planType planExpiry createdAt subscription premium')
      .sort({ createdAt: -1 })
      .lean();

    const total = users.length;
    const rowsAll = users.map((user) => {
      const planType = getPlanTypeFromUser(user) || 'free';
      const startDate = getSubscriptionStartFromUser(user);
      const endDate = getPlanExpiryFromUser(user);
      const premium = user?.subscription?.premium === true || user?.subscription?.premium === 'true' || Boolean(user?.premium) || isActiveUser(user);
      const status = premium || isFutureDate(endDate) ? 'active' : 'inactive';

      return {
        id: String(user._id),
        userId: String(user._id),
        name: getNameFromUser(user),
        planType,
        status,
        premium,
        startDate,
        endDate,
        createdAt: user.createdAt,
      };
    });

    const skip = (page - 1) * limit;
    const rows = rowsAll.slice(skip, skip + limit);
    const activeSubscriptions = rowsAll.filter((row) => row.status === 'active').length;
    const premiumUsers = rowsAll.filter((row) => row.premium).length;

    res.json({
      success: true,
      data: {
        subscriptions: rows,
        rows,
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        summary: {
          totalSubscriptions: total,
          activeSubscriptions,
          premiumUsers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminStats,
  getAdminUsers,
  getAdminLeads,
  getAdminSubscriptions,
};