const express = require('express');
const paymentController = require('../controllers/paymentController');
const authModule = require('../middleware/auth');

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

router.get('/plans', paymentController.getPlans);
router.post('/subscribe', protect, paymentController.createOrder);
router.post('/subscribe/order', protect, paymentController.createOrder);
router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.post('/subscribe/verify', protect, paymentController.verifyPayment);
router.post('/payment/verify', protect, paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook);
router.post('/webhook/razorpay', paymentController.handleWebhook);

module.exports = router;