const express = require('express');
const { createEstimate, getEstimateById, generateEstimatePdf, convertEstimateToLead } = require('../../controllers/estimateController');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', createEstimate);
router.get('/:id', getEstimateById);
router.get('/:id/pdf', generateEstimatePdf);
router.post('/:id/leads', convertEstimateToLead);

module.exports = router;
