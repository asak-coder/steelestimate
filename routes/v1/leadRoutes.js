const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const {
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLeadScoring,
  getHistory,
  getAdminStats,
  getDashboard
} = require('../../controllers/leadController');
const { leadStatusSchema } = require('../../validators/leadValidator');
const { validate } = require('../../middleware/validation');
const { requireAdmin } = require('../../middleware/auth');
const { adminLimiter } = require('../../middleware/rateLimiters');

const router = express.Router();

router.use(requireAuth);

router.get('/history', getHistory);
router.get('/admin/stats', requireAdmin, adminLimiter, getAdminStats);
router.get('/dashboard', getDashboard);
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.patch('/:id', validate(leadStatusSchema), updateLeadStatus);
router.put('/:id', updateLeadStatus);
router.post('/:id/score', updateLeadScoring);

module.exports = router;
