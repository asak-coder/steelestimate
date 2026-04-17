const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { getPlanList, getPlanByKey, getDefaultPaidPlan, isPaidPlan } = require('../utils/paymentPlans');

const parseRazorpayAmount = (plan) => {
  return plan.amount;
};

const buildOrderPayload = (user, planKey) => {
  const plan = getPlanByKey(planKey) || getDefaultPaidPlan();

  if (!plan) {
    throw new AppError('Invalid subscription plan selected', 400);
  }

  return {
    amount: parseRazorpayAmount(plan),
    currency: plan.currency || 'INR',
    receipt: `receipt_${user._id.toString()}_${Date.now()}`,
    notes: {
      userId: user._id.toString(),
      userEmail: user.email,
      plan: plan.key
    }
  };
};

const createOrder = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const selectedPlan = getPlanByKey(plan) || getDefaultPaidPlan();
    if (!selectedPlan || selectedPlan.amount <= 0) {
      throw new AppError('A valid paid plan is required', 400);
    }

    const orderPayload = buildOrderPayload(user, selectedPlan.key);
    const razorpayOrderId = `order_${crypto.randomBytes(12).toString('hex')}`;

    user.subscription = user.subscription || {};
    user.subscription.plan = selectedPlan.key;
    user.subscription.status = 'pending';
    user.subscription.premium = false;
    user.subscription.payment = user.subscription.payment || {};
    user.subscription.payment.razorpayOrderId = razorpayOrderId;
    user.subscription.payment.lastPaymentAmount = orderPayload.amount;
    user.subscription.payment.lastPaymentCurrency = orderPayload.currency;
    await user.save();

    return res.status(201).json({
      success: true,
      order: {
        id: razorpayOrderId,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        receipt: orderPayload.receipt,
        notes: orderPayload.notes
      },
      plan: selectedPlan
    });
  } catch (error) {
    return next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      plan
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError('Payment verification data is incomplete', 400);
    }

    const user = await User.findById(req.user?.id).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const subscriptionPlan = getPlanByKey(plan) || getPlanByKey(user.subscription?.plan) || getDefaultPaidPlan();
    if (!subscriptionPlan || !isPaidPlan(subscriptionPlan.key)) {
      throw new AppError('Invalid plan for payment verification', 400);
    }

    const orderSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', orderSecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new AppError('Invalid payment signature', 400);
    }

    user.subscription = user.subscription || {};
    user.subscription.plan = subscriptionPlan.key;
    user.subscription.premium = true;
    user.subscription.status = 'active';
    user.subscription.startDate = user.subscription.startDate || new Date();
    user.subscription.endDate = null;
    user.subscription.razorpaySubscriptionId = user.subscription.razorpaySubscriptionId || null;
    user.subscription.payment = user.subscription.payment || {};
    user.subscription.payment.razorpayOrderId = razorpayOrderId;
    user.subscription.payment.razorpayPaymentId = razorpayPaymentId;
    user.subscription.payment.razorpaySignature = razorpaySignature;
    user.subscription.payment.razorpaySubscriptionId = user.subscription.razorpaySubscriptionId || null;
    user.subscription.payment.lastPaymentAt = new Date();
    user.subscription.payment.lastPaymentAmount = getPlanByKey(subscriptionPlan.key).amount;
    user.subscription.payment.lastPaymentCurrency = getPlanByKey(subscriptionPlan.key).currency || 'INR';

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    return next(error);
  }
};

const getPlans = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      plans: getPlanList()
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPlans
};