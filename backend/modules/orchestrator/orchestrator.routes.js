const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { runOrchestrator } = require('./orchestrator.controller');

const router = express.Router();

router.post('/run', requireAuth, runOrchestrator);

module.exports = router;