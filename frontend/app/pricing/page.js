'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSubscribeOrder, verifyPayment } from '@/lib/api';

const PLAN_ORDER = ['free', 'basic', 'pro', 'premium'];

const PLAN_CATALOG = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    amountLabel: '₹0',
    description: 'Start estimating with the core workflow, no commitment required.',
    features: ['10 estimate calculations / day', 'BOQ exports locked', 'Ads enabled'],
    buttonLabel: 'Current Plan',
    cta: 'Best for trying SteelEstimate',
    highlight: false,
  },
  {
    key: 'basic',
    name: 'Basic',
    price: 499,
    interval: 'month',
    amountLabel: '₹499',
    description: 'A light paid plan for individuals who need a little more room.',
    features: ['Unlimited estimates', 'BOQ exports unlocked', 'Ad-free experience'],
    buttonLabel: 'Upgrade',
    cta: 'Ideal for small teams',
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 999,
    interval: 'month',
    amountLabel: '₹999',
    description: 'For regular users who rely on SteelEstimate every day.',
    features: ['Unlimited estimates', 'BOQ exports unlocked', 'Priority support'],
    buttonLabel: 'Upgrade',
    cta: 'Most popular for pros',
    highlight: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 1999,
    interval: 'month',
    amountLabel: '₹1,999',
    description: 'The full experience with every paid feature unlocked.',
    features: ['Unlimited estimates', 'BOQ exports unlocked', 'Ad-free experience'],
    buttonLabel: 'Upgrade',
    cta: 'Best for growing businesses',
    highlight: false,
  },
];

const PLAN_LOOKUP = new Map(PLAN_CATALOG.map((plan) => [plan.key, plan]));

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let razorpayScriptPromise = null;

function normalizePlanKey(value) {
  if (!value) return 'free';
  const normalized = String(value).trim().toLowerCase();

  if (PLAN_LOOKUP.has(normalized)) return normalized;
  if (normalized.includes('premium')) return 'premium';
  if (normalized.includes('pro')) return 'pro';
  if (normalized.includes('basic')) return 'basic';
  if (normalized.includes('free')) return 'free';

  return 'free';
}

function getPlanRank(planKey) {
  const index = PLAN_ORDER.indexOf(normalizePlanKey(planKey));
  return index === -1 ? 0 : index;
}

function formatExpiry(expiry) {
  if (!expiry) return null;
  const date = new Date(expiry);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function extractUserFromResponse(payload) {
  if (!payload) return null;
  if (payload.user && typeof payload.user === 'object') return payload.user;
  if (payload.data && typeof payload.data === 'object' && payload.data.user) return payload.data.user;
  if (payload.result && typeof payload.result === 'object' && payload.result.user) return payload.result.user;
  return null;
}

function extractPlanFromUser(user) {
  if (!user || typeof user !== 'object') return 'free';

  const candidates = [
    user.planType,
    user?.subscription?.plan,
    user.plan,
    user?.subscription?.planType,
    user?.subscription?.premium ? 'premium' : null,
  ]
    .map(normalizePlanKey)
    .filter(Boolean);

  let best = 'free';
  for (const candidate of candidates) {
    if (getPlanRank(candidate) > getPlanRank(best)) {
      best = candidate;
    }
  }

  return best;
}

function isPaidPlan(planKey) {
  return normalizePlanKey(planKey) !== 'free';
}

function emitAuthChange(user) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('steelestimate-auth-change', { detail: user || null }));
}

function readCachedUser() {
  if (typeof window === 'undefined') return null;

  if (window.__STEEL_ESTIMATE_USER__ && typeof window.__STEEL_ESTIMATE_USER__ === 'object') {
    return window.__STEEL_ESTIMATE_USER__;
  }

  const preferredKeys = [
    'steelestimate-user',
    'steelestimate_user',
    'steelestimate-auth-user',
    'authUser',
    'currentUser',
    'user',
  ];

  for (const key of preferredKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const plan = extractPlanFromUser(parsed);
        if (plan || parsed.id || parsed._id || parsed.email) {
          return parsed;
        }
      }
    } catch (_) {
      // ignore invalid JSON
    }
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw || raw[0] !== '{') continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const plan = extractPlanFromUser(parsed);
        if (plan !== 'free' || parsed.subscription || parsed.planType) {
          return parsed;
        }
      }
    } catch (_) {
      // ignore malformed entries
    }
  }

  return null;
}

function planButtonLabel(currentRank, planKey) {
  const plan = PLAN_LOOKUP.get(planKey);
  if (!plan) return 'Select';

  if (plan.key === 'free') {
    return 'Current Plan';
  }

  if (currentRank >= getPlanRank(planKey)) {
    return 'Current plan';
  }

  return 'Upgrade';
}

function summarizeFeatureFlags(planKey) {
  const paid = isPaidPlan(planKey);
  return {
    adsEnabled: !paid,
    canExportBoq: paid,
    isPaid: paid,
  };
}

async function loadRazorpayScript() {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
        if (window.Razorpay) resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

function PlanBadge({ label, tone = 'neutral' }) {
  const toneClasses = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        toneClasses[tone] || toneClasses.neutral
      }`}
    >
      {label}
    </span>
  );
}

function PricingCard({
  plan,
  currentPlanKey,
  onSelect,
  isLoading,
  isSelected,
  featureFlags,
}) {
  const currentRank = getPlanRank(currentPlanKey);
  const planRank = getPlanRank(plan.key);
  const isCurrentOrHigher = currentRank >= planRank;
  const buttonLabel = planButtonLabel(currentRank, plan.key);

  return (
    <div
      className={[
        'relative flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm transition',
        plan.highlight ? 'border-blue-200 ring-2 ring-blue-100' : 'border-slate-200',
        isSelected ? 'shadow-lg' : '',
      ].join(' ')}
    >
      {plan.highlight ? (
        <div className="absolute right-6 top-6">
          <PlanBadge label="Popular" tone="primary" />
        </div>
      ) : null}

      <div className="mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
          {currentPlanKey === plan.key ? <PlanBadge label="Active" tone="success" /> : null}
        </div>
        <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
      </div>

      <div className="mb-5">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black tracking-tight text-slate-900">{plan.amountLabel}</span>
          <span className="pb-1 text-sm text-slate-500">/{plan.interval}</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">{plan.cta}</p>
      </div>

      <ul className="mb-6 space-y-3 text-sm text-slate-700">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <PlanBadge
          label={featureFlags.isPaid ? 'Ad-free' : 'Ads enabled'}
          tone={featureFlags.isPaid ? 'success' : 'warning'}
        />
        <PlanBadge
          label={featureFlags.canExportBoq ? 'BOQ export unlocked' : 'BOQ export locked'}
          tone={featureFlags.canExportBoq ? 'success' : 'warning'}
        />
      </div>

      <button
        type="button"
        onClick={() => onSelect(plan.key)}
        disabled={isLoading || isCurrentOrHigher || plan.key === 'free'}
        className={[
          'mt-auto inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition',
          isCurrentOrHigher || plan.key === 'free'
            ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500'
            : 'bg-slate-900 text-white hover:bg-slate-800',
        ].join(' ')}
      >
        {isLoading ? 'Please wait…' : buttonLabel}
      </button>

      {plan.key === 'free' ? (
        <p className="mt-3 text-center text-xs text-slate-500">No payment required</p>
      ) : currentRank > planRank ? (
        <p className="mt-3 text-center text-xs text-slate-500">Your current plan already includes this tier</p>
      ) : null}
    </div>
  );
}

export default function PricingPage() {
  const [activeUser, setActiveUser] = useState(null);
  const [pendingPlanKey, setPendingPlanKey] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const currentPlanKey = useMemo(() => extractPlanFromUser(activeUser), [activeUser]);
  const featureFlags = useMemo(() => summarizeFeatureFlags(currentPlanKey), [currentPlanKey]);

  const hydrateUser = useCallback(() => {
    const cachedUser = readCachedUser();
    if (cachedUser) {
      setActiveUser(cachedUser);
    }
  }, []);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handler = (event) => {
      const nextUser = event?.detail || readCachedUser();
      if (nextUser) {
        setActiveUser(nextUser);
      }
    };

    window.addEventListener('steelestimate-auth-change', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('steelestimate-auth-change', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const finalizePayment = useCallback(async ({ planKey, order, razorpayResponse }) => {
    const verifyPayload = {
      planKey,
      plan: planKey,
      orderId: order?.id || order?.orderId || order?.razorpayOrderId,
      razorpay_order_id: razorpayResponse?.razorpay_order_id,
      paymentId: razorpayResponse?.razorpay_payment_id,
      razorpay_payment_id: razorpayResponse?.razorpay_payment_id,
      signature: razorpayResponse?.razorpay_signature,
      razorpay_signature: razorpayResponse?.razorpay_signature,
    };

    const verification = await verifyPayment(verifyPayload);
    const updatedUser =
      extractUserFromResponse(verification) ||
      verification?.user ||
      verification?.data?.user ||
      (verification && (verification.planType || verification.subscription) ? verification : null);

    if (updatedUser) {
      setActiveUser(updatedUser);
      if (typeof window !== 'undefined') {
        window.__STEEL_ESTIMATE_USER__ = updatedUser;
        window.localStorage.setItem('steelestimate-user', JSON.stringify(updatedUser));
      }
      emitAuthChange(updatedUser);
    }

    setMessage('Subscription activated successfully.');
    setError(null);
  }, []);

  const handleUpgrade = useCallback(
    async (planKey) => {
      const normalizedPlanKey = normalizePlanKey(planKey);
      const plan = PLAN_LOOKUP.get(normalizedPlanKey);

      if (!plan || plan.key === 'free') {
        return;
      }

      if (getPlanRank(currentPlanKey) >= getPlanRank(plan.key)) {
        setMessage('This plan is already active in your account.');
        return;
      }

      setPendingPlanKey(plan.key);
      setError(null);
      setMessage(null);

      try {
        const orderResponse = await createSubscribeOrder({
          planKey: plan.key,
          plan: plan.key,
        });

        const order = orderResponse?.order || orderResponse?.data?.order || orderResponse?.data || orderResponse;
        const razorpayOrderId = order?.id || order?.orderId || order?.razorpayOrderId;
        const razorpayKeyId =
          orderResponse?.keyId ||
          orderResponse?.key_id ||
          orderResponse?.razorpayKeyId ||
          orderResponse?.razorpay_key_id ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY;

        if (!razorpayOrderId) {
          throw new Error('The payment order could not be created.');
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
          throw new Error('Razorpay checkout failed to load.');
        }

        const checkout = new window.Razorpay({
          key: razorpayKeyId,
          amount: order?.amount || Math.round(plan.price * 100),
          currency: order?.currency || 'INR',
          name: 'SteelEstimate',
          description: `${plan.name} subscription`,
          order_id: razorpayOrderId,
          prefill: {
            name: activeUser?.name || activeUser?.fullName || '',
            email: activeUser?.email || '',
            contact: activeUser?.phone || activeUser?.mobile || '',
          },
          notes: {
            planKey: plan.key,
            plan: plan.key,
          },
          theme: {
            color: '#0f172a',
          },
          modal: {
            ondismiss: () => {
              setPendingPlanKey(null);
            },
          },
          handler: async (razorpayResponse) => {
            try {
              await finalizePayment({
                planKey: plan.key,
                order,
                razorpayResponse,
              });
            } catch (paymentError) {
              setError(paymentError?.message || 'Unable to verify payment.');
            } finally {
              setPendingPlanKey(null);
            }
          },
        });

        checkout.on('payment.failed', (response) => {
          setError(response?.error?.description || 'Payment was not completed.');
          setPendingPlanKey(null);
        });

        checkout.open();
      } catch (upgradeError) {
        setError(upgradeError?.message || 'Unable to start checkout.');
        setPendingPlanKey(null);
      }
    },
    [activeUser, currentPlanKey, finalizePayment]
  );

  const currentPlan = PLAN_LOOKUP.get(currentPlanKey) || PLAN_LOOKUP.get('free');
  const currentExpiry = formatExpiry(activeUser?.planExpiry || activeUser?.subscription?.endDate);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <PlanBadge
            label={featureFlags.isPaid ? 'Paid plan active' : 'Free plan active'}
            tone={featureFlags.isPaid ? 'success' : 'warning'}
          />
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Choose the right plan for your workflow
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Compare the Free, Basic, Pro, and Premium tiers. Upgrade when you need unlimited calculations, BOQ export, and a cleaner experience.
          </p>
        </div>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Your current plan</p>
              <h2 className="mt-2 text-2xl font-bold">{currentPlan?.name || 'Free'}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <PlanBadge
                  label={featureFlags.adsEnabled ? 'Ads enabled' : 'Ad-free'}
                  tone={featureFlags.adsEnabled ? 'warning' : 'success'}
                />
                <PlanBadge
                  label={featureFlags.canExportBoq ? 'BOQ export enabled' : 'BOQ export locked'}
                  tone={featureFlags.canExportBoq ? 'success' : 'warning'}
                />
                <PlanBadge
                  label={featureFlags.isPaid ? 'Unlimited calculations' : '10 calculations / day'}
                  tone={featureFlags.isPaid ? 'success' : 'warning'}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-slate-100 px-5 py-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Plan expiry</p>
              <p className="mt-1">{currentExpiry || 'No expiry for the Free plan'}</p>
            </div>
          </div>
        </section>

        {message ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-4">
          {PLAN_CATALOG.map((plan) => (
            <PricingCard
              key={plan.key}
              plan={plan}
              currentPlanKey={currentPlanKey}
              onSelect={handleUpgrade}
              isLoading={pendingPlanKey === plan.key}
              isSelected={pendingPlanKey === plan.key}
              featureFlags={summarizeFeatureFlags(plan.key)}
            />
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">Feature access overview</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Free users</p>
              <p className="mt-2 text-sm text-slate-600">
                10 estimate calculations per day, BOQ export blocked, ads shown across the app.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Paid users</p>
              <p className="mt-2 text-sm text-slate-600">
                Unlimited estimates, BOQ export unlocked, and the app runs ad-free.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Need help?</p>
              <p className="mt-2 text-sm text-slate-600">
                If checkout fails, make sure Razorpay keys are configured and your account is authenticated.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
