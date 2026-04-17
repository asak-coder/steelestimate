const PLANS = {
  free: {
    key: 'free',
    name: 'Free',
    displayName: 'Free',
    description: 'Basic access to the platform',
    amount: 0,
    currency: 'INR',
    interval: null,
    razorpayPlanId: null
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    displayName: 'Starter',
    description: 'Affordable subscription for growing teams',
    amount: 49900,
    currency: 'INR',
    interval: 'monthly',
    razorpayPlanId: process.env.RAZORPAY_STARTER_PLAN_ID || null
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    displayName: 'Pro',
    description: 'Advanced access with premium features',
    amount: 99900,
    currency: 'INR',
    interval: 'monthly',
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID || null
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    displayName: 'Enterprise',
    description: 'Custom access for large organizations',
    amount: 249900,
    currency: 'INR',
    interval: 'monthly',
    razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID || null
  }
};

const PAID_PLAN_KEYS = ['starter', 'pro', 'enterprise'];

const getPlanByKey = (planKey) => {
  if (!planKey) {
    return PLANS.free;
  }

  return PLANS[String(planKey).toLowerCase()] || null;
};

const getDefaultPaidPlan = () => PLANS.pro;

const getPlanList = () => Object.values(PLANS).map((plan) => ({
  key: plan.key,
  name: plan.name,
  displayName: plan.displayName,
  description: plan.description,
  amount: plan.amount,
  currency: plan.currency,
  interval: plan.interval,
  razorpayPlanId: plan.razorpayPlanId,
  isPaid: plan.amount > 0
}));

const isPaidPlan = (planKey) => PAID_PLAN_KEYS.includes(String(planKey || '').toLowerCase());

module.exports = {
  PLANS,
  PAID_PLAN_KEYS,
  getDefaultPaidPlan,
  getPlanByKey,
  getPlanList,
  isPaidPlan
};