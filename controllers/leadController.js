const Lead = require('../models/Lead');
const AppError = require('../utils/appError');
const { calculateLeadScore } = require('../services/leadScoringService');

const allowedStatuses = ['new', 'contacted', 'converted'];

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

const getLeads = async (req, res, next) => {
  try {
    const userFilter = req.user?.role === 'admin' ? {} : { userId: req.user.id };
    const leads = await Lead.find(userFilter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads.map(sanitizeLead)
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

    if (req.user?.role !== 'admin' && lead.userId.toString() !== req.user.id) {
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
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      throw new AppError('Invalid lead id', 400);
    }

    if (!allowedStatuses.includes(status)) {
      throw new AppError('status must be one of new, contacted, converted', 400);
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    if (req.user?.role !== 'admin' && lead.userId.toString() !== req.user.id) {
      throw new AppError('Not authorized to update this lead', 403);
    }

    lead.status = status;
    await lead.save();

    return res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
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

    if (req.user?.role !== 'admin' && lead.userId.toString() !== req.user.id) {
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
              $cond: [{ $eq: ['$status', 'converted'] }, 1, 0]
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
  getLeadById,
  updateLeadStatus,
  updateLeadScoring,
  getHistory,
  getAdminStats
};
