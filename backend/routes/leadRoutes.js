const express = require("express");
const {
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLeadScoring,
  getHistory,
  getAdminStats,
  getDashboard,
  createLead
} = require("../controllers/leadController");

const { leadStatusSchema } = require("../validators/leadValidator");
const { validate } = require("../middleware/validation");
const { requireAuth, requireAdmin, requireAdminOrManager } = require("../middleware/auth");
const { adminLimiter, sensitiveLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/", sensitiveLimiter, createLead);

router.use(requireAuth);

router.get("/admin/stats", requireAdmin, adminLimiter, getAdminStats);
router.get("/dashboard", sensitiveLimiter, getDashboard);
router.get("/history", sensitiveLimiter, getHistory);
router.get("/", sensitiveLimiter, getLeads);
router.get("/:id", sensitiveLimiter, getLeadById);

router.patch("/:id", requireAdminOrManager, sensitiveLimiter, validate(leadStatusSchema), updateLeadStatus);
router.put("/:id", requireAdminOrManager, sensitiveLimiter, validate(leadStatusSchema), updateLeadStatus);
router.post("/:id/score", requireAdminOrManager, sensitiveLimiter, updateLeadScoring);

module.exports = router;
