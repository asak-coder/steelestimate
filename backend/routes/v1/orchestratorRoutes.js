const express = require('express');
const { run, generatePdf } = require('../../controllers/orchestratorController');
const { requireAuth } = require('../../middleware/auth');
const { sensitiveLimiter } = require('../../middleware/rateLimiters');

const router = express.Router();

router.post('/run', requireAuth, sensitiveLimiter, run);
router.get('/:id/pdf', requireAuth, sensitiveLimiter, generatePdf);

module.exports = router;
