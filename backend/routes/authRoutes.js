const express = require("express");
const { register, signup, login, logout, getMe } = require("../controllers/authController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", authLimiter, logout);
router.get("/me", requireAuth, getMe);

module.exports = router;
