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

const router = express.Router();

router.use(requireAuth);

router.get('/history', getHistory);
router.get('/admin/stats', requireAdmin, adminLimiter, getAdminStats);
router.get('/dashboard', getDashboard);
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.patch('/:id', validate(leadStatusSchema), updateLeadStatus);
router.put('/:id', validate(leadStatusSchema), updateLeadStatus);
router.post('/:id/score', updateLeadScoring);
router.post('/', requireAdmin, adminLimiter, validate(leadStatusSchema), async (req, res, next) => {
  try {
    const { Lead } = require('../models/Lead');
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
module.exports = router;
