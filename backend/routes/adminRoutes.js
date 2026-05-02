const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiters');
const {
  getAdminStats,
  getAdminUsers,
  getAdminLeads,
  getAdminSubscriptions,
} = require('../controllers/leadController');

const router = express.Router();

router.get('/stats', verifyToken, requireAdmin, adminLimiter, getAdminStats);
router.get('/users', verifyToken, requireAdmin, adminLimiter, getAdminUsers);
router.get('/leads', verifyToken, requireAdmin, adminLimiter, getAdminLeads);
router.get('/subscriptions', verifyToken, requireAdmin, adminLimiter, getAdminSubscriptions);

module.exports = router;
