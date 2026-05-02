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
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { adminLimiter, sensitiveLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

const requireRoles = (roles) => (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();

  if (!role || !roles.map((item) => String(item).toLowerCase()).includes(role)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  return next();
};

router.post("/", sensitiveLimiter, createLead);
router.post("/track-usage", trackCalculatorUsage);

router.get("/admin/stats", verifyToken, requireAdmin, adminLimiter, getAdminStats);
router.get("/dashboard", verifyToken, sensitiveLimiter, getDashboard);
router.get("/history", verifyToken, sensitiveLimiter, getHistory);
router.get("/", verifyToken, sensitiveLimiter, getLeads);
router.get("/:id", verifyToken, sensitiveLimiter, getLeadById);

router.patch("/:id", verifyToken, requireRoles(["admin", "manager"]), sensitiveLimiter, validate(leadStatusSchema), updateLeadStatus);
router.put("/:id", verifyToken, requireRoles(["admin", "manager"]), sensitiveLimiter, validate(leadStatusSchema), updateLeadStatus);
router.post("/:id/score", verifyToken, requireRoles(["admin", "manager"]), sensitiveLimiter, updateLeadScoring);

module.exports = router;
