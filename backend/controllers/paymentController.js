const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require('../models/User');
const errorHandler = require('../middleware/errorHandler');
const paymentPlans = require('../utils/paymentPlans');

const AppError =
  typeof errorHandler.AppError === 'function'
    ? errorHandler.AppError
    : class AppError extends Error {
        constructor(message, statusCode = 500) {
          super(message);
          this.name = 'AppError';
          this.statusCode = statusCode;
          this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
          this.isOperational = true;
          Error.captureStackTrace?.(this, this.constructor);
        }
      };

function getPlanList() {
  if (paymentPlans && typeof paymentPlans.getPlanList === 'function') return paymentPlans.getPlanList();
  if (paymentPlans && typeof paymentPlans.getPlans === 'function') return paymentPlans.getPlans();
  if (paymentPlans && Array.isArray(paymentPlans.planList)) return paymentPlans.planList;
  if (paymentPlans && Array.isArray(paymentPlans.plans)) return paymentPlans.plans;
  return [];
}

function normalizePlan(plan = {}) {
  const key = String(plan.key || plan.planKey || plan.slug || plan.id || plan.name || plan.title || '').toLowerCase();
  const name = plan.name || plan.title || key;
  const interval = String(plan.interval || plan.billingCycle || plan.duration || 'month').toLowerCase();
  const rawAmount = Number(plan.amount ?? plan.price ?? plan.amountInRupees ?? plan.cost ?? plan.value ?? 0);
  const amountInMinorUnits = Number(
    plan.amountInMinorUnits ??
      plan.amountInPaise ??
      plan.amountPaise ??
      plan.priceInPaise ??
      plan.priceInMinorUnits ??
      null
  );
  const currency = String(plan.currency || 'INR').toUpperCase();
  const description = plan.description || plan.desc || '';
  const premium = typeof plan.premium === 'boolean' ? plan.premium : key !== 'free';

  return {
    ...plan,
    key,
    name,
    interval,
    amount: Number.isFinite(rawAmount) ? rawAmount : 0,
    amountInMinorUnits: Number.isFinite(amountInMinorUnits) ? amountInMinorUnits : null,
    currency,
    description,
    premium,
  };
}

function getPlanByKeyOrName(input) {
  const list = getPlanList().map(normalizePlan);
  const raw = typeof input === 'string' ? input : (input && (input.planKey || input.plan || input.planType || input.key || input.slug || input.name || input.title)) || '';
  const key = String(raw).toLowerCase();

  if (!key) return null;

  return (
    list.find((plan) => plan.key === key) ||
    list.find((plan) => String(plan.name || '').toLowerCase() === key) ||
    list.find((plan) => String(plan.title || '').toLowerCase() === key) ||
    list.find((plan) => String(plan.slug || '').toLowerCase() === key) ||
    null
  );
}

function isPaidPlan(plan) {
  return Boolean(plan && plan.key && plan.key !== 'free');
}

function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new AppError('Razorpay configuration is missing.', 500);
  }

  return new Razorpay({ key_id, key_secret });
}

function toMinorUnits(planOrAmount, currency = 'INR') {
  if (planOrAmount && typeof planOrAmount === 'object') {
    const explicitMinor = Number(
      planOrAmount.amountInMinorUnits ??
        planOrAmount.amountInPaise ??
        planOrAmount.amountPaise ??
        planOrAmount.priceInPaise ??
        planOrAmount.priceInMinorUnits ??
        null
    );
    if (Number.isFinite(explicitMinor) && explicitMinor > 0) {
      return Math.round(explicitMinor);
    }
  }

  const numeric = Number(
    typeof planOrAmount === 'object'
      ? planOrAmount.amount ?? planOrAmount.price ?? planOrAmount.value ?? 0
      : planOrAmount || 0
  );
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  if (String(currency).toUpperCase() === 'INR') return Math.round(numeric * 100);
  return Math.round(numeric);
}

function addInterval(date, interval = 'month') {
  const result = new Date(date);
  const normalized = String(interval || 'month').toLowerCase();

  if (normalized.includes('year')) {
    result.setUTCFullYear(result.getUTCFullYear() + 1);
    return result;
  }

  if (normalized.includes('week')) {
    result.setUTCDate(result.getUTCDate() + 7);
    return result;
  }

  if (normalized.includes('day')) {
    const dayMatch = normalized.match(/(\d+)/);
    const days = dayMatch ? Number(dayMatch[1]) : 1;
    result.setUTCDate(result.getUTCDate() + (Number.isFinite(days) && days > 0 ? days : 1));
    return result;
  }

  const monthMatch = normalized.match(/(\d+)/);
  const months = monthMatch ? Number(monthMatch[1]) : 1;
  result.setUTCMonth(result.getUTCMonth() + (Number.isFinite(months) && months > 0 ? months : 1));
  return result;
}

function safeUserPayload(userDoc) {
  const user = typeof userDoc?.toObject === 'function' ? userDoc.toObject() : { ...(userDoc || {}) };
  [
    'password',
    'resetPasswordToken',
    'resetPasswordExpire',
    'verificationToken',
    'emailVerificationToken',
    'otp',
    'googleId',
  ].forEach((key) => {
    if (key in user) delete user[key];
  });
  return user;
}

function buildSubscriptionPatch(user, plan, identifiers = {}, status = 'active') {
  const now = new Date();
  const startDate = identifiers.startDate ? new Date(identifiers.startDate) : now;
  const endDate = identifiers.endDate ? new Date(identifiers.endDate) : isPaidPlan(plan) ? addInterval(startDate, plan.interval || 'month') : null;

  return {
    planType: plan.key,
    planExpiry: endDate,
    subscription: {
      ...(user.subscription || {}),
      plan: plan.key,
      planKey: plan.key,
      planType: plan.key,
      premium: isPaidPlan(plan),
      status,
      startDate,
      endDate,
      amount: toMinorUnits(plan, plan.currency),
      currency: plan.currency || 'INR',
      razorpayOrderId: identifiers.razorpayOrderId || user.subscription?.razorpayOrderId || null,
      razorpayPaymentId: identifiers.razorpayPaymentId || user.subscription?.razorpayPaymentId || null,
      razorpaySignature: identifiers.razorpaySignature || user.subscription?.razorpaySignature || null,
      razorpaySubscriptionId: identifiers.razorpaySubscriptionId || user.subscription?.razorpaySubscriptionId || null,
      pendingPlanKey: identifiers.pendingPlanKey || user.subscription?.pendingPlanKey || null,
      pendingOrderId: identifiers.pendingOrderId || user.subscription?.pendingOrderId || null,
      lastPaymentAt: now,
      updatedAt: now,
    },
  };
}

async function createOrder(req, res, next) {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return next(new AppError('Authentication required', 401));

    const selectedPlanInput =
      req.body?.planKey ||
      req.body?.plan ||
      req.body?.planType ||
      req.body?.selectedPlan ||
      req.body?.selectedPlanKey ||
      req.body?.selected_plan ||
      req.body?.subscriptionPlan;
    const plan = getPlanByKeyOrName(selectedPlanInput);
    if (!plan) return next(new AppError('Invalid plan selected.', 400));

    const user = await User.findById(userId);
    if (!user) return next(new AppError('User not found.', 404));

    if (!isPaidPlan(plan)) {
      user.planType = 'free';
      user.planExpiry = null;
      user.subscription = {
        ...(user.subscription || {}),
        plan: 'free',
        planKey: 'free',
        planType: 'free',
        premium: false,
        status: 'active',
        startDate: new Date(),
        endDate: null,
        pendingPlanKey: null,
        pendingOrderId: null,
      };
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Free plan selected.',
        plan,
        order: null,
        keyId: process.env.RAZORPAY_KEY_ID || null,
        user: safeUserPayload(user),
      });
    }

    const amount = toMinorUnits(plan, plan.currency);
    if (!amount || amount <= 0) return next(new AppError('Invalid plan amount.', 400));

    const razorpay = getRazorpayClient();
    const receipt = `sub_${String(userId)}_${plan.key}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount,
      currency: plan.currency || 'INR',
      receipt,
      payment_capture: 1,
      notes: {
        userId: String(userId),
        planKey: plan.key,
        planName: plan.name || plan.key,
      },
    });

    user.subscription = {
      ...(user.subscription || {}),
      status: 'pending',
      premium: true,
      plan: plan.key,
      planKey: plan.key,
      planType: plan.key,
      pendingPlanKey: plan.key,
      pendingOrderId: order.id,
      razorpayOrderId: order.id,
      amount,
      currency: plan.currency || 'INR',
      updatedAt: new Date(),
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Order created successfully.',
      plan,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      },
      keyId: process.env.RAZORPAY_KEY_ID || null,
      user: safeUserPayload(user),
    });
  } catch (error) {
    return next(error);
  }
}

function verifySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new AppError('Razorpay configuration is missing.', 500);
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return expected === signature;
}

async function verifyPayment(req, res, next) {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return next(new AppError('Authentication required', 401));

    const body = req.body || {};
    const orderId = body.razorpay_order_id || body.orderId || body.order_id || body.order || body.razorpayOrderId;
    const paymentId = body.razorpay_payment_id || body.paymentId || body.payment_id || body.payment || body.razorpayPaymentId;
    const signature = body.razorpay_signature || body.signature || body.razorpaySignature;
    const planInput =
      body.planKey ||
      body.plan ||
      body.planType ||
      body.selectedPlan ||
      body.selectedPlanKey ||
      body.selected_plan ||
      body.subscriptionPlan;

    if (orderId && paymentId && signature && !verifySignature(orderId, paymentId, signature)) {
      return next(new AppError('Payment verification failed.', 400));
    }

    const user = await User.findById(userId);
    if (!user) return next(new AppError('User not found.', 404));

    const plan =
      getPlanByKeyOrName(planInput) ||
      getPlanByKeyOrName(user.subscription?.pendingPlanKey) ||
      getPlanByKeyOrName(user.subscription?.planKey) ||
      getPlanByKeyOrName(user.planType) ||
      normalizePlan({ key: 'free', name: 'Free', amount: 0, currency: 'INR', interval: 'month', premium: false });

    if (isPaidPlan(plan) && (!orderId || !paymentId || !signature)) {
      return next(new AppError('Missing payment verification details.', 400));
    }

    const identifiers = {
      razorpayOrderId: orderId || user.subscription?.razorpayOrderId || null,
      razorpayPaymentId: paymentId || user.subscription?.razorpayPaymentId || null,
      razorpaySignature: signature || user.subscription?.razorpaySignature || null,
      razorpaySubscriptionId:
        body.razorpay_subscription_id ||
        body.subscriptionId ||
        body.razorpaySubscriptionId ||
        user.subscription?.razorpaySubscriptionId ||
        null,
      pendingPlanKey: null,
      pendingOrderId: null,
    };

    const patch = buildSubscriptionPatch(user, plan, identifiers, 'active');
    user.planType = patch.planType;
    user.planExpiry = patch.planExpiry;
    user.subscription = patch.subscription;

    if (!isPaidPlan(plan)) {
      user.subscription.premium = false;
      user.subscription.status = 'active';
      user.subscription.endDate = null;
      user.planExpiry = null;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      user: safeUserPayload(user),
      plan,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPlans(req, res, next) {
  try {
    const plans = getPlanList().map(normalizePlan);
    return res.status(200).json({
      success: true,
      plans,
      data: { plans },
    });
  } catch (error) {
    return next(error);
  }
}

function getRawWebhookBody(req) {
  if (req && req.rawBody) return Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody);
  if (Buffer.isBuffer(req?.body)) return req.body;
  if (typeof req?.body === 'string') return Buffer.from(req.body);
  return Buffer.from(JSON.stringify(req?.body || {}));
}

function extractWebhookPayload(req) {
  if (Buffer.isBuffer(req?.body)) {
    try {
      return JSON.parse(req.body.toString('utf8'));
    } catch (error) {
      return {};
    }
  }
  if (typeof req?.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }
  return req?.body || {};
}

async function handleWebhook(req, res, next) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signatureHeader = req.headers['x-razorpay-signature'];

    if (signatureHeader && secret) {
      const expected = crypto.createHmac('sha256', secret).update(getRawWebhookBody(req)).digest('hex');
      if (expected !== signatureHeader) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature.',
        });
      }
    }

    const payload = extractWebhookPayload(req);
    const event = payload.event || '';
    const body = payload.payload || {};
    const paymentEntity = body.payment?.entity || body.payment?.payment || body.payment || {};
    const orderEntity = body.order?.entity || body.order || {};
    const subscriptionEntity = body.subscription?.entity || body.subscription || {};

    const orderId = paymentEntity.order_id || orderEntity.id || paymentEntity.orderId || subscriptionEntity.razorpay_order_id;
    const paymentId = paymentEntity.id || paymentEntity.payment_id;
    const signature = paymentEntity.signature || signatureHeader || null;
    const planKey =
      paymentEntity.notes?.planKey ||
      orderEntity.notes?.planKey ||
      subscriptionEntity.notes?.planKey ||
      payload.planKey ||
      payload.plan ||
      null;

    let user = null;
    if (orderId) {
      user = await User.findOne({
        $or: [{ 'subscription.razorpayOrderId': orderId }, { 'subscription.pendingOrderId': orderId }],
      });
    }
    if (!user && paymentEntity.notes?.userId) {
      user = await User.findById(paymentEntity.notes.userId);
    }

    if (!user) {
      return res.status(200).json({ success: true, received: true, handled: false, event });
    }

    const plan = getPlanByKeyOrName(planKey) || getPlanByKeyOrName(user.subscription?.pendingPlanKey) || getPlanByKeyOrName(user.planType);
    if (plan) {
      const patch = buildSubscriptionPatch(
        user,
        plan,
        {
          razorpayOrderId: orderId || user.subscription?.razorpayOrderId || null,
          razorpayPaymentId: paymentId || user.subscription?.razorpayPaymentId || null,
          razorpaySignature: signature || user.subscription?.razorpaySignature || null,
          razorpaySubscriptionId:
            subscriptionEntity.id ||
            subscriptionEntity.subscription_id ||
            user.subscription?.razorpaySubscriptionId ||
            null,
          pendingPlanKey: null,
          pendingOrderId: null,
        },
        'active'
      );

      user.planType = patch.planType;
      user.planExpiry = patch.planExpiry;
      user.subscription = patch.subscription;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      received: true,
      handled: true,
      event,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  getPlans,
  handleWebhook,
};