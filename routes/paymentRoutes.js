const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createOrder, verifyPayment, getPlans } = require('../controllers/paymentController');

const router = express.Router();

router.get('/plans', getPlans);
router.post('/create-order', requireAuth, createOrder);
router.post('/verify', requireAuth, verifyPayment);

module.exports = router;