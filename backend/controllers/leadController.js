const Lead = require('../models/Lead');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { calculateLeadScore } = require('../services/leadScoringService');
const { sendEmail, sendInternalNotificationEmail, isValidEmail } = require('../services/emailService');

const allowedStatuses = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const legacyStatusMap = {
  new: 'NEW',
  contacted: 'IN_PROGRESS',
  converted: 'COMPLETED'
};
const allowedSources = ['calculator', 'ai', 'boq', 'mobile', 'admin', 'api'];
const allowedPriorities = ['normal', 'high'];
const statusKeys = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const sourceKeys = ['calculator', 'ai', 'boq', 'mobile', 'admin', 'api'];
const adminOnlyFields = new Set([
  'score',
  'tag',
  'optimizedPrice',
  'marginSuggestion',
  'pricingJustification',
  'quotationText',
  'cost',
  'priority',
  'estimatedCost',
  'projectType',
  'source',
  'whatsappLink',
  'whatsappMessage',
  'adminNotifiedAt',
  'emailSentAt'
]);

const isValidObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeEmail = (value) => {
  const email = normalizeString(value).toLowerCase();
  return isValidEmail(email) ? email : '';
};
const normalizePhone = (value) => normalizeString(value).replace(/[^\d+]/g, '');
const normalizeSource = (value) => {
  const source = normalizeString(value).toLowerCase();
  return allowedSources.includes(source) ? source : 'calculator';
};
const normalizePriority = (value) => {
  const priority = normalizeString(value).toLowerCase();
  return allowedPriorities.includes(priority) ? priority : 'normal';
};
const normalizeStatus = (value) => {
  const status = normalizeString(value).toUpperCase();
  if (allowedStatuses.includes(status)) {
    return status;
  }

  const legacy = legacyStatusMap[normalizeString(value).toLowerCase()];
  return legacy || 'NEW';
};
const normalizeLeadText = (value) => {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/\s+/g, ' ');
};

const parseCostValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const extractEstimatedCost = (payload = {}) => {
  const candidates = [
    payload.estimatedCost,
    payload.optimizedPrice,
    payload.cost?.estimatedCost,
    payload.cost?.totalCost,
    payload.cost?.finalCost,
    payload.cost?.amount,
    payload.projectData?.estimatedCost,
    payload.projectData?.budget,
    payload.projectData?.cost
  ];

  for (const candidate of candidates) {
    const numeric = parseCostValue(candidate);
    if (numeric > 0) {
      return numeric;
    }
  }

  return 0;
};

const extractProjectType = (payload = {}) => {
  const candidates = [
    payload.projectType,
    payload.project,
    payload.projectName,
    payload.projectData?.projectType,
    payload.projectData?.type,
    payload.projectData?.category,
    payload.projectData?.projectName,
    payload.projectData?.name,
    payload.boq?.projectType,
    payload.boq?.type
  ];

  for (const candidate of candidates) {
    const text = normalizeString(candidate);
    if (text) {
      return text;
    }
  }

  return '';
};

const getWhatsAppBusinessNumber = () => {
  const raw =
    process.env.WHATSAPP_PHONE_NUMBER ||
    process.env.WHATSAPP_NUMBER ||
    process.env.WHATSAPP_BUSINESS_NUMBER ||
    process.env.WHATSAPP_ADMIN_NUMBER ||
    '';

  return normalizePhone(raw).replace(/^\+/, '');
};

const buildWhatsAppMessage = ({ clientName, phone, projectType, estimatedCost, source }) => {
  const name = clientName || 'there';
  const costText = estimatedCost > 0 ? `Estimated cost: ₹${estimatedCost.toLocaleString('en-IN')}` : 'Estimated cost not available yet';
  const sourceText = source ? `Source: ${source}` : 'Source: calculator';
  const projectText = projectType ? `Project: ${projectType}` : 'Project details received';

  return [
    `Hello ${name},`,
    '',
    `Thanks for your enquiry with SteelEstimate.`,
    projectText,
    costText,
    sourceText,
    phone ? `Contact: ${phone}` : '',
    '',
    'Our team will get back to you shortly.'
  ]
    .filter(Boolean)
    .join('\n');
};

const buildWhatsAppLink = (phone, message) => {
  const businessNumber = getWhatsAppBusinessNumber();
  if (!businessNumber) {
    return '';
  }

  const cleanPhone = normalizePhone(phone).replace(/^\+/, '');
  const target = businessNumber || cleanPhone;
  if (!target) {
    return '';
  }

  const url = `https://wa.me/${target}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
};

const buildLeadEmailTemplate = ({ clientName, projectType, estimatedCost, source, whatsappLink, websiteUrl }) => {
  const safeClientName = clientName || 'Client';
  const safeProjectType = projectType || 'your project';
  const safeCost = estimatedCost > 0 ? `₹${estimatedCost.toLocaleString('en-IN')}` : 'to be confirmed';
  const safeSource = source || 'calculator';
  const safeLink = whatsappLink || websiteUrl || '';

  return {
    subject: `SteelEstimate summary for ${safeProjectType}`,
    text: [
      `Dear ${safeClientName},`,
      '',
      `Thank you for submitting ${safeProjectType} details through SteelEstimate.`,
      `Estimated cost: ${safeCost}`,
      `Lead source: ${safeSource}`,
      safeLink ? `WhatsApp link: ${safeLink}` : '',
      '',
      'Our team will review your enquiry and respond shortly.',
      '',
      'Regards,',
      'SteelEstimate Team'
    ]
      .filter(Boolean)
      .join('\n'),
    html: [
      `<p>Dear ${safeClientName},</p>`,
      `<p>Thank you for submitting <strong>${safeProjectType}</strong> details through SteelEstimate.</p>`,
      `<p><strong>Estimated cost:</strong> ${safeCost}</p>`,
      `<p><strong>Lead source:</strong> ${safeSource}</p>`,
      safeLink ? `<p><a href="${safeLink}">Open WhatsApp conversation</a></p>` : '',
      '<p>Our team will review your enquiry and respond shortly.</p>',
      '<p>Regards,<br/>SteelEstimate Team</p>'
    ]
      .filter(Boolean)
      .join('')
  };
};

const sanitizeLead = (lead) => ({
  id: lead._id,
  userId: lead.userId,
  clientName: lead.clientName,
  name: lead.name,
  phone: lead.phone,
  email: lead.email,
  message: lead.message,
  projectType: lead.projectType,
  estimatedCost: lead.estimatedCost,
  source: lead.source,
  priority: lead.priority,
  whatsappLink: lead.whatsappLink,
  whatsappMessage: lead.whatsappMessage,
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
  adminNotifiedAt: lead.adminNotifiedAt,
  emailSentAt: lead.emailSentAt,
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
    } else {
      delete normalized.status;
    }
  }

  if (normalized.priority) {
    const priority = normalizePriority(normalized.priority);
    if (allowedPriorities.includes(priority)) {
      normalized.priority = priority;
    } else {
      delete normalized.priority;
    }
  }

  if (normalized.source) {
    const source = normalizeSource(normalized.source);
    if (allowedSources.includes(source)) {
      normalized.source = source;
    } else {
      delete normalized.source;
    }
  }

  if (normalized.score !== undefined && normalized.score !== '') {
    const scoreValue = Number(normalized.score);
    if (Number.isFinite(scoreValue)) {
      normalized.score = scoreValue;
    }
  }

  if (normalized.minCost !== undefined && normalized.minCost !== '') {
    const minCost = Number(normalized.minCost);
    if (Number.isFinite(minCost)) {
      normalized.estimatedCost = { ...(normalized.estimatedCost || {}), $gte: minCost };
    }
    delete normalized.minCost;
  }

  if (normalized.maxCost !== undefined && normalized.maxCost !== '') {
    const maxCost = Number(normalized.maxCost);
    if (Number.isFinite(maxCost)) {
      normalized.estimatedCost = { ...(normalized.estimatedCost || {}), $lte: maxCost };
    }
    delete normalized.maxCost;
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
      { name: searchRegex },
      { projectType: searchRegex },
      { message: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ];
  }

  return normalized;
};

const buildLeadAggregationSummary = async () => {
  const [stats] = await Lead.aggregate([
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        highPriorityLeads: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'high'] }, 1, 0]
          }
        },
        totalEstimatedRevenue: { $sum: { $ifNull: ['$optimizedPrice', '$estimatedCost'] } },
        statusCounts: { $push: '$status' },
        sourceCounts: { $push: '$source' }
      }
    }
  ]);

  const totalLeads = stats?.totalLeads || 0;
  const highPriorityLeads = stats?.highPriorityLeads || 0;
  const totalEstimatedRevenue = Math.round((stats?.totalEstimatedRevenue || 0) * 100) / 100;
  const baseStatusCounts = statusKeys.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
  const statusCounts = (stats?.statusCounts || []).reduce((acc, status) => {
    const normalized = legacyStatusMap[String(status || '').toLowerCase()] || String(status || '').toUpperCase() || 'NEW';
    if (acc[normalized] !== undefined) {
      acc[normalized] += 1;
    }
    return acc;
  }, baseStatusCounts);
  const baseSourceCounts = sourceKeys.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
  const sourceCounts = (stats?.sourceCounts || []).reduce((acc, source) => {
    const normalized = normalizeSource(source);
    if (acc[normalized] !== undefined) {
      acc[normalized] += 1;
    }
    return acc;
  }, baseSourceCounts);

  return {
    totalLeads,
    highPriorityLeads,
    totalEstimatedRevenue,
    statusCounts,
    sourceCounts
  };
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
    const phone = normalizePhone(payload.phone || payload.contactPhone || payload.mobile || payload.whatsappNumber);

    if (!phone) {
      throw new AppError('Phone number is required', 400);
    }

    const clientName = normalizeString(
      payload.clientName || payload.name || payload.contactName || payload.projectData?.clientName || ''
    );
    const email = normalizeEmail(payload.email);
    const projectType = extractProjectType(payload);
    const estimatedCost = extractEstimatedCost(payload);
    const source = normalizeSource(payload.source || payload.leadSource || payload.origin);
    const priority = estimatedCost > 1000000 ? 'high' : normalizePriority(payload.priority);
    const scoreData = calculateLeadScore(payload.projectData || payload);
    const whatsappMessage = buildWhatsAppMessage({
      clientName,
      phone,
      projectType,
      estimatedCost,
      source
    });
    const whatsappLink = buildWhatsAppLink(phone, whatsappMessage);
    const status = normalizeStatus(payload.status || 'NEW');
    const rawNotes = normalizeLeadText(payload.notes || payload.message || '');
    const safePayload = {
      ...payload,
      name: normalizeString(payload.name || clientName),
      clientName,
      phone,
      email: email || undefined,
      projectType,
      estimatedCost,
      source,
      priority,
      whatsappLink,
      whatsappMessage,
      score: scoreData.score,
      tag: scoreData.tag,
      status,
      userId: req.user?.id || payload.userId || null,
      message: rawNotes || payload.message || '',
      cost: payload.cost || null,
      projectData: payload.projectData || null,
      boq: payload.boq || null,
      quotationText: payload.quotationText || '',
      optimizedPrice: parseCostValue(payload.optimizedPrice || payload.cost?.optimizedPrice || 0)
    };

    const lead = await Lead.create(safePayload);

    const websiteUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const automationErrors = [];

    if (lead.email) {
      try {
        const emailTemplate = buildLeadEmailTemplate({
          clientName: lead.clientName || lead.name,
          projectType: lead.projectType,
          estimatedCost: lead.estimatedCost,
          source: lead.source,
          whatsappLink: lead.whatsappLink,
          websiteUrl
        });

        await sendEmail({
          to: lead.email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
          replyTo: process.env.EMAIL_USER
        });

        lead.emailSentAt = new Date();
      } catch (emailError) {
        automationErrors.push({
          channel: 'email',
          message: emailError.message
        });
      }
    }

    try {
      await sendInternalNotificationEmail({
        subject: `New lead received: ${lead.clientName || lead.name || lead.phone}`,
        message: `A new lead has arrived from ${lead.source || 'calculator'} with estimated cost ₹${(lead.estimatedCost || 0).toLocaleString('en-IN')}.`,
        html: [
          `<p>A new lead has arrived.</p>`,
          `<p><strong>Name:</strong> ${lead.clientName || lead.name || 'Unknown'}</p>`,
          `<p><strong>Phone:</strong> ${lead.phone}</p>`,
          lead.email ? `<p><strong>Email:</strong> ${lead.email}</p>` : '',
          lead.projectType ? `<p><strong>Project:</strong> ${lead.projectType}</p>` : '',
          `<p><strong>Estimated cost:</strong> ₹${(lead.estimatedCost || 0).toLocaleString('en-IN')}</p>`,
          `<p><strong>Priority:</strong> ${lead.priority}</p>`,
          lead.whatsappLink ? `<p><a href="${lead.whatsappLink}">Open WhatsApp conversation</a></p>` : ''
        ]
          .filter(Boolean)
          .join('')
      });

      lead.adminNotifiedAt = new Date();
    } catch (notifyError) {
      automationErrors.push({
        channel: 'admin-notification',
        message: notifyError.message
      });
    }

    await lead.save();

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: sanitizeLead(lead),
      automation: {
        whatsappLink: lead.whatsappLink,
        whatsappMessage: lead.whatsappMessage,
        priority: lead.priority,
        emailSent: Boolean(lead.emailSentAt),
        adminNotified: Boolean(lead.adminNotifiedAt),
        errors: automationErrors
      }
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

    if (req.user?.role !== 'ADMIN' && lead.userId?.toString() !== req.user.id) {
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
      payload.status = normalizeStatus(payload.status);
      if (!allowedStatuses.includes(payload.status)) {
        throw new AppError('status must be one of NEW, IN_PROGRESS, COMPLETED, REJECTED', 400);
      }
    }

    if (payload.priority) {
      payload.priority = normalizePriority(payload.priority);
    }

    if (payload.source) {
      payload.source = normalizeSource(payload.source);
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    if (req.user?.role !== 'ADMIN' && lead.userId?.toString() !== req.user.id) {
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

    if (req.user?.role !== 'ADMIN' && lead.userId?.toString() !== req.user.id) {
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
      location:
        lead.projectData?.location ||
        lead.projectData?.siteLocation ||
        lead.projectData?.projectLocation ||
        'Unknown location',
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
    const leadSummary = await buildLeadAggregationSummary();

    const recentLeads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        totalLeads: leadSummary.totalLeads,
        highPriorityLeads: leadSummary.highPriorityLeads,
        statusCounts: leadSummary.statusCounts,
        sourceCounts: leadSummary.sourceCounts,
        recentLeads: recentLeads.map(sanitizeLead)
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const leadSummary = await buildLeadAggregationSummary();
    const [userSummary] = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $ne: ['$planType', 'free'] },
                    { $eq: ['$subscription.premium', true] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const totalUsers = userSummary?.totalUsers || 0;
    const activeUsers = userSummary?.activeUsers || 0;
    const totalRevenue = leadSummary.totalEstimatedRevenue;
    const conversionCount = leadSummary.statusCounts.COMPLETED || 0;
    const conversionRate = leadSummary.totalLeads > 0 ? Math.round((conversionCount / leadSummary.totalLeads) * 10000) / 100 : 0;

    const recentLeads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('clientName status createdAt optimizedPrice score tag userId priority source estimatedCost')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalLeads: leadSummary.totalLeads,
        totalRevenue,
        activeUsers,
        conversionRate,
        conversionCount,
        highPriorityLeads: leadSummary.highPriorityLeads,
        leadStatusCounts: leadSummary.statusCounts,
        leadSourceCounts: leadSummary.sourceCounts,
        recentLeads: recentLeads.map((lead) => sanitizeLead(lead))
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminLeads = async (req, res, next) => {
  try {
    const query = normalizeLeadQuery(req.query || {});
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const skip = (page - 1) * limit;
    const sort = req.query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [summary, totalCount, leads] = await Promise.all([
      buildLeadAggregationSummary(),
      Lead.countDocuments(query),
      Lead.find(query).sort(sort).skip(skip).limit(limit)
    ]);

    return res.status(200).json({
      success: true,
      count: leads.length,
      total: totalCount,
      page,
      limit,
      filters: {
        status: req.query.status || '',
        priority: req.query.priority || '',
        source: req.query.source || '',
        search: req.query.search || ''
      },
      summary,
      data: leads.map(sanitizeLead)
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('name email role planType planExpiry createdAt updatedAt subscription')
      .lean();

    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.planType !== 'free' || user.subscription?.premium).length;

    return res.status(200).json({
      success: true,
      count: users.length,
      data: {
        totalUsers,
        activeUsers,
        users
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminSubscriptions = async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('name email role planType planExpiry createdAt subscription')
      .lean();

    const subscriptions = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      planType: user.planType,
      planExpiry: user.planExpiry,
      subscription: user.subscription,
      premium: Boolean(user.subscription?.premium)
    }));

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
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
  getAdminLeads,
  getAdminUsers,
  getAdminSubscriptions,
  getDashboard
};
