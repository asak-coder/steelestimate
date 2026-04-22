const express = require("express");
const {
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLeadScoring,
  getHistory,
  getAdminStats,
  getDashboard,
  trackCalculatorUsage,
  createLead
} = require("../controllers/leadController");

const { leadStatusSchema } = require("../validators/leadValidator");
const { validate } = require("../middleware/validation");
const auth = require("../middleware/auth");
const { adminLimiter, sensitiveLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

const requireRoles = (roles) => (req, res, next) => {
  const role = req.user?.role;

  if (!role || !roles.includes(role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};

router.post("/", sensitiveLimiter, createLead);
router.post("/track-usage", trackCalculatorUsage);

router.get("/admin/stats", auth, requireRoles(["ADMIN"]), adminLimiter, getAdminStats);
router.get("/dashboard", auth, sensitiveLimiter, getDashboard);
router.get("/history", auth, sensitiveLimiter, getHistory);
router.get("/", auth, sensitiveLimiter, getLeads);
router.get("/:id", auth, sensitiveLimiter, getLeadById);

router.patch("/:id", auth, requireRoles(["ADMIN", "MANAGER"]), sensitiveLimiter, validate(leadStatusSchema), updateLeadStatus);
router.put("/:id", auth, requireRoles(["ADMIN", "MANAGER"]), sensitiveLimiter, validate(leadStatusSchema), updateLeadStatus);
router.post("/:id/score", auth, requireRoles(["ADMIN", "MANAGER"]), sensitiveLimiter, updateLeadScoring);

module.exports = router;
