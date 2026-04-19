const Lead = require('../models/Lead');
const AppError = require('../utils/appError');
const { calculateLeadScore } = require('../services/leadScoringService');

const allowedStatuses = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const legacyStatusMap = {
  new: 'NEW',
  contacted: 'IN_PROGRESS',
  converted: 'COMPLETED'
};
const statusKeys = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const adminOnlyFields = new Set([
  'score',
  'tag',
  'optimizedPrice',
  'marginSuggestion',
  'pricingJustification',
  'quotationText',
  'cost'
]);

const isValidObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

const sanitizeLead = (lead) => ({
  id: lead._id,
  userId: lead.userId,
  clientName: lead.clientName,
  phone: lead.phone,
  email: lead.email,
  projectData: lead.projectData,
  boq: lead.boq,
  cost: lead.cost,
  quotationText: lead.quotationText,
  score: lead.score,
  tag: lead.tag,
  optimizedPrice: lead.optimizedPrice,
  marginSuggestion: lead.marginSuggestion,
  pricingJustification: lead.pricingJustification,
  status: lead.status,
  createdAt: lead.createdAt
});

const normalizeLeadQuery = (query = {}) => {
  const normalized = { ...query };

  if (normalized.status) {
    const rawStatus = String(normalized.status).trim();
    const upperStatus = rawStatus.toUpperCase();

    if (allowedStatuses.includes(upperStatus)) {
      normalized.status = upperStatus;
    } else if (legacyStatusMap[rawStatus.toLowerCase()]) {
      normalized.status = legacyStatusMap[rawStatus.toLowerCase()];
    }
  }

  if (normalized.score !== undefined && normalized.score !== '') {
    const scoreValue = Number(normalized.score);
    if (Number.isFinite(scoreValue)) {
      normalized.score = scoreValue;
    }
  }

  if (normalized.from) {
    const fromDate = new Date(normalized.from);
    if (!Number.isNaN(fromDate.getTime())) {
      normalized.createdAt = { ...(normalized.createdAt || {}), $gte: fromDate };
    }
    delete normalized.from;
  }

  if (normalized.to) {
    const toDate = new Date(normalized.to);
    if (!Number.isNaN(toDate.getTime())) {
      normalized.createdAt = { ...(normalized.createdAt || {}), $lte: toDate };
    }
    delete normalized.to;
  }

  if (normalized.search) {
    const searchRegex = new RegExp(String(normalized.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    normalized.$or = [
      { clientName: searchRegex },
      { company: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ];
  }

  return normalized;
};

const getLeads = async (req, res, next) => {
  try {
    const userFilter = req.user?.role === 'ADMIN' ? {} : { userId: req.user.id };
    const query = normalizeLeadQuery({ ...userFilter, ...req.query });

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads.map(sanitizeLead)
    });
  } catch (error) {
    return next(error);
  }
};

const createLead = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const lead = await Lead.create({
      ...payload,
      userId: req.user?.id || payload.userId || null,
      status: payload.status ? String(payload.status).toUpperCase() : 'NEW'
    });

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: sanitizeLead(lead)
    });
  } catch (error) {
    return next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new AppError('Invalid lead id', 400);
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    if (req.user?.role !== 'ADMIN' && lead.userId.toString() !== req.user.id) {
      throw new AppError('Not authorized to access this lead', 403);
    }

    return res.status(200).json({
      success: true,
      data: sanitizeLead(lead)
    });
  } catch (error) {
    return next(error);
  }
};

const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    if (!isValidObjectId(id)) {
      throw new AppError('Invalid lead id', 400);
    }

    if (payload.status) {
      payload.status = String(payload.status).toUpperCase();
      if (!allowedStatuses.includes(payload.status)) {
        throw new AppError('status must be one of NEW, IN_PROGRESS, COMPLETED, REJECTED', 400);
      }
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    if (req.user?.role !== 'ADMIN' && lead.userId.toString() !== req.user.id) {
      throw new AppError('Not authorized to update this lead', 403);
    }

    Object.keys(payload).forEach((key) => {
      if (payload[key] !== undefined && (key === 'status' || req.user?.role === 'admin' || !adminOnlyFields.has(key))) {
        lead[key] = payload[key];
      }
    });

    await lead.save();

    return res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: sanitizeLead(lead)
    });
  } catch (error) {
    return next(error);
  }
};

const rescoreLead = async (lead) => {
  const scoreData = calculateLeadScore(lead.projectData || {});
  lead.score = scoreData.score;
  lead.tag = scoreData.tag;
  return lead.save();
};

const updateLeadScoring = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new AppError('Invalid lead id', 400);
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    if (req.user?.role !== 'ADMIN' && lead.userId.toString() !== req.user.id) {
      throw new AppError('Not authorized to update this lead', 403);
    }

    const updatedLead = await rescoreLead(lead);

    return res.status(200).json({
      success: true,
      message: 'Lead score updated successfully',
      data: sanitizeLead(updatedLead)
    });
  } catch (error) {
    return next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const leads = await Lead.find({ userId: req.user.id }).sort({ createdAt: -1 });

    const history = leads.map((lead) => ({
      id: lead._id,
      date: lead.createdAt,
      cost: lead.cost,
      location: lead.projectData?.location || lead.projectData?.siteLocation || lead.projectData?.projectLocation || 'Unknown location',
      clientName: lead.clientName,
      quotationText: lead.quotationText,
      optimizedPrice: lead.optimizedPrice,
      status: lead.status
    }));

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    return next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const [stats] = await Lead.aggregate([
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          statusCounts: {
            $push: '$status'
          }
        }
      }
    ]);

    const totalLeads = stats?.totalLeads || 0;
    const baseCounts = statusKeys.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    const statusCounts = (stats?.statusCounts || []).reduce((acc, status) => {
      const normalized = legacyStatusMap[String(status || '').toLowerCase()] || String(status || '').toUpperCase() || 'NEW';
      if (acc[normalized] !== undefined) {
        acc[normalized] += 1;
      }
      return acc;
    }, baseCounts);

    const recentLeads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        totalLeads,
        statusCounts,
        recentLeads: recentLeads.map(sanitizeLead)
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const [stats] = await Lead.aggregate([
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          totalEstimatedRevenue: { $sum: { $ifNull: ['$optimizedPrice', 0] } },
          convertedLeads: {
            $sum: {
              $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalLeads = stats?.totalLeads || 0;
    const totalEstimatedRevenue = Math.round((stats?.totalEstimatedRevenue || 0) * 100) / 100;
    const conversionCount = stats?.convertedLeads || 0;
    const conversionRate = totalLeads > 0 ? Math.round((conversionCount / totalLeads) * 10000) / 100 : 0;

    const recentLeads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('clientName status createdAt optimizedPrice score tag userId');

    return res.status(200).json({
      success: true,
      data: {
        totalLeads,
        totalEstimatedRevenue,
        conversionRate,
        conversionCount,
        recentLeads: recentLeads.map(sanitizeLead)
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLeads,
  createLead,
  getLeadById,
  updateLeadStatus,
  updateLeadScoring,
  getHistory,
  getAdminStats,
  getDashboard
};
