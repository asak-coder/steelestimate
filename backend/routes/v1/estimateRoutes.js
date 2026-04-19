const express = require('express');
const { calculateEstimate } = require('../../modules/estimation/controller');
const { requireAuth } = require('../../middleware/auth');
const { getEstimatesHistory } = require('../../controllers/estimateController');

const router = express.Router();

router.get('/', requireAuth, getEstimatesHistory);
router.post('/calculate', requireAuth, calculateEstimate);

module.exports = router;