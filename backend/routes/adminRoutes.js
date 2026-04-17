const express = require('express');
const { getAdminStats } = require('../controllers/leadController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.use(requireAuth, requireAdmin, adminLimiter);

router.get('/stats', getAdminStats);

module.exports = router;
