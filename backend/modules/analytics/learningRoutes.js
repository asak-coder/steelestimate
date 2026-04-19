const express = require('express');
const auth = require('../../middleware/auth');
const { getLearningInsights } = require('./learningController');

const router = express.Router();

router.get('/learning-insights', auth, getLearningInsights);

module.exports = router;