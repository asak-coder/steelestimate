const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiters');
const {
  getAdminStats,
  getAdminUsers,
  getAdminLeads,
  getAdminSubscriptions,
} = require('../controllers/leadController');
const {
  getSecurityEvents,
  getSecurityLogins,
  getSecuritySummary,
  getSecurityLive
} = require('../controllers/adminSecurityController');

const router = express.Router();

router.get('/stats', verifyToken, requireAdmin, adminLimiter, getAdminStats);
router.get('/users', verifyToken, requireAdmin, adminLimiter, getAdminUsers);
router.get('/leads', verifyToken, requireAdmin, adminLimiter, getAdminLeads);
router.get('/subscriptions', verifyToken, requireAdmin, adminLimiter, getAdminSubscriptions);
router.get('/security/events', verifyToken, requireAdmin, adminLimiter, getSecurityEvents);
router.get('/security/logins', verifyToken, requireAdmin, adminLimiter, getSecurityLogins);
router.get('/security/summary', verifyToken, requireAdmin, adminLimiter, getSecuritySummary);
router.get('/security/live', verifyToken, requireAdmin, adminLimiter, getSecurityLive);

module.exports = router;
