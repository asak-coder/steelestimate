const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiters');
const {
  getAdminStats,
  getAdminUsers,
  getAdminLeads,
  getAdminSubscriptions,
} = require('../controllers/leadController');

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, adminLimiter, getAdminStats);
router.get('/users', requireAuth, requireAdmin, adminLimiter, getAdminUsers);
router.get('/leads', requireAuth, requireAdmin, adminLimiter, getAdminLeads);
router.get('/subscriptions', requireAuth, requireAdmin, adminLimiter, getAdminSubscriptions);

module.exports = router;
