const express = require('express');
const authModule = require('../../middleware/auth');
const { attachPlanFlags } = require('../../middleware/featureGate');
const { requireDailyUsageLimit } = require('../../middleware/usageLimiter');

let estimateController = {};
try {
  estimateController = require('../../controllers/estimateController');
} catch (error) {
  try {
    estimateController = require('../../modules/estimation/controller');
  } catch (fallbackError) {
    estimateController = {};
  }
}

const router = express.Router();

const protectCandidate =
  (authModule &&
    (authModule.protect ||
      authModule.protectRoute ||
      authModule.requireAuth ||
      authModule.authMiddleware ||
      authModule.authenticate ||
      authModule.auth ||
      authModule.ensureAuthenticated ||
      authModule.default)) ||
  authModule;
const protect = typeof protectCandidate === 'function' ? protectCandidate : (req, res, next) => next();

function pickHandler(controller, candidates) {
  for (const name of candidates) {
    if (controller && typeof controller[name] === 'function') {
      return controller[name];
    }
  }
  return (req, res) =>
    res.status(501).json({
      success: false,
      message: 'This estimate endpoint is not configured.',
    });
}

const calculateEstimate = pickHandler(estimateController, [
  'calculateEstimate',
  'createEstimate',
  'generateEstimate',
  'estimateCalculation',
  'calculate',
]);
const getEstimates = pickHandler(estimateController, [
  'getEstimates',
  'listEstimates',
  'getAllEstimates',
  'fetchEstimates',
]);
const getEstimateById = pickHandler(estimateController, [
  'getEstimateById',
  'getEstimate',
  'fetchEstimateById',
]);
const saveEstimate = pickHandler(estimateController, [
  'saveEstimate',
  'createEstimateRecord',
  'storeEstimate',
  'saveEstimateRecord',
]);

router.use(protect, attachPlanFlags);

router.post('/calculate', requireDailyUsageLimit('estimate_calculation'), calculateEstimate);
router.post('/calculate-quote', requireDailyUsageLimit('estimate_calculation'), calculateEstimate);
router.post('/estimate', requireDailyUsageLimit('estimate_calculation'), calculateEstimate);
router.post('/create', requireDailyUsageLimit('estimate_calculation'), calculateEstimate);
router.post('/', requireDailyUsageLimit('estimate_calculation'), calculateEstimate);
router.post('/save', saveEstimate);
router.post('/estimates/save', saveEstimate);

router.get('/', getEstimates);
router.get('/estimates', getEstimates);
router.get('/:id', getEstimateById);
router.get('/estimates/:id', getEstimateById);

module.exports = router;