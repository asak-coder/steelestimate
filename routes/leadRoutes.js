const express = require('express');
const {
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLeadScoring,
  getHistory,
  getAdminStats,
  getDashboard
} = require('../controllers/leadController');

const { leadStatusSchema } = require('../validators/leadValidator');
const { validate } = require('../middleware/validation');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiters');

const Lead = require('../models/Lead');

const router = express.Router();

// =====================================
// ✅ PUBLIC ROUTE (MOBILE APP)
// =====================================
router.post('/', async (req, res, next) => {
  try {
    const lead = new Lead({
      ...req.body,
      status: String(req.body.status || 'NEW').toUpperCase()
    });

    await lead.save();

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// =====================================
// 🔐 PROTECTED ROUTES (ADMIN ONLY)
// =====================================

router.use(requireAuth);

// Admin stats
router.get('/admin/stats', requireAdmin, adminLimiter, getAdminStats);

// Dashboard
router.get('/dashboard', getDashboard);

// Lead history
router.get('/history', getHistory);

// All leads
router.get('/', getLeads);

// Single lead
router.get('/:id', getLeadById);

// Update lead status
router.patch('/:id', validate(leadStatusSchema), updateLeadStatus);
router.put('/:id', validate(leadStatusSchema), updateLeadStatus);

// Lead scoring
router.post('/:id/score', updateLeadScoring);

module.exports = router;