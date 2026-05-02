const express = require('express');
const { login, refreshToken, logout } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user
  });
});

module.exports = router;
