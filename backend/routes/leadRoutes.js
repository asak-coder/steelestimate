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
const { requireAuth, requireAdmin, requireAdminOrManager, requireViewer } = require("../middleware/auth");
const { adminLimiter, sensitiveLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.use(requireAuth);

router.post("/", requireAdminOrManager, sensitiveLimiter, createLead);

router.get("/admin/stats", requireAdmin, adminLimiter, getAdminStats);
router.get("/dashboard", requireViewer, sensitiveLimiter, getDashboard);
router.get("/history", requireViewer, sensitiveLimiter, getHistory);
router.get("/", requireViewer, sensitiveLimiter, getLeads);
router.get("/:id", requireViewer, sensitiveLimiter, getLeadById);

router.patch("/:id", requireAdminOrManager, sensitiveLimiter, validate(leadStatusSchema), updateLeadStatus);
router.put("/:id", requireAdminOrManager, sensitiveLimiter, validate(leadStatusSchema), updateLeadStatus);
router.post("/:id/score", requireAdminOrManager, sensitiveLimiter, updateLeadScoring);

module.exports = router;
