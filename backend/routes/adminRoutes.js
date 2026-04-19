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

router.use(requireAuth, requireAdmin, adminLimiter);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.get('/leads', getAdminLeads);
router.get('/subscriptions', getAdminSubscriptions);

module.exports = router;