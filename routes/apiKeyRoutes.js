const express = require('express');
const { generateApiKey } = require('../controllers/apiKeyController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

const router = express.Router();

router.post('/generate', generateApiKey);
router.get('/usage', apiKeyAuth, (req, res) => {
  return res.json({
    success: true,
    plan: req.apiUser.plan,
    usageLimit: req.apiUser.usageLimit,
    usedRequests: req.apiUser.usedRequests,
    usagePeriod: req.apiUser.usagePeriod,
    usageResetAt: req.apiUser.usageResetAt
  });
});

module.exports = router;
