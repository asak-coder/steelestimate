const express = require('express');
const { calculateEstimate } = require('./controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.post('/calculate', requireAuth, calculateEstimate);

module.exports = router;