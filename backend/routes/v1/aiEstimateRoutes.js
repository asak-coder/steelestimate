const express = require('express');
const { verifyToken } = require('../../middleware/auth');
const { attachPlanFlags } = require('../../middleware/featureGate');
const { requireDailyUsageLimit } = require('../../middleware/usageLimiter');
const { calculateAIEstimate } = require('../../services/aiEstimateService');

const router = express.Router();

router.post(
  '/estimate',
  verifyToken,
  attachPlanFlags,
  requireDailyUsageLimit('ai_estimation', {
    metadata: {
      feature: 'ai_estimation',
      source: 'api/ai/estimate'
    }
  }),
  async (req, res, next) => {
    try {
      const output = await calculateAIEstimate(req.body || {});

      return res.status(200).json({
        success: true,
        data: output
      });
    } catch (error) {
      if (error && error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: error.message || 'Invalid AI estimate input'
        });
      }

      return next(error);
    }
  }
);

module.exports = router;
