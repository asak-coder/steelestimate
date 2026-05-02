const express = require('express');
const {
  login,
  verify2FA,
  refreshToken,
  logout,
  setup2FA,
  enable2FA,
  disable2FA
} = require('../controllers/authController');
const {
  getSessions,
  revokeSession,
  getLoginLogs,
  getSecurityEvents
} = require('../controllers/authAnalyticsController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { loginLimiter, twoFactorLimiter } = require('../middleware/rateLimiters');
const { bruteForceProtection } = require('../middleware/bruteForceProtection');

const router = express.Router();

router.post('/login', loginLimiter, bruteForceProtection, login);
router.post('/2fa/login', twoFactorLimiter, verify2FA);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/2fa/setup', verifyToken, requireAdmin, setup2FA);
router.post('/2fa/verify', verifyToken, requireAdmin, enable2FA);
router.post('/2fa/disable', verifyToken, requireAdmin, disable2FA);
router.get('/sessions', verifyToken, requireAdmin, getSessions);
router.delete('/sessions/:refreshTokenId', verifyToken, requireAdmin, revokeSession);
router.get('/login-logs', verifyToken, requireAdmin, getLoginLogs);
router.get('/security-events', verifyToken, requireAdmin, getSecurityEvents);
router.get('/me', verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
    user: req.user
  });
});

module.exports = router;
