"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { createPaymentOrder, getMe, getPlans, verifyPayment } from "../../lib/api";

const PLAN_ORDER = ["free", "starter", "pro", "premium", "enterprise"];

function formatCurrency(plan) {
  if (!plan) return "₹0";
  if (plan.priceText) return plan.priceText;
  if (typeof plan.price === "number") {
    return plan.price === 0 ? "₹0" : `₹${plan.price}`;
  }
  return plan.name === "Free" ? "₹0" : "Custom";
}

function getPlanKey(plan) {
  return (plan?.key || plan?.slug || plan?.id || plan?.name || "").toString().toLowerCase();
}

function isCurrentPlanHigher(currentPlan, targetPlan) {
  const currentIndex = PLAN_ORDER.indexOf(getPlanKey(currentPlan));
  const targetIndex = PLAN_ORDER.indexOf(getPlanKey(targetPlan));

  if (currentIndex === -1 || targetIndex === -1) {
    return false;
  }

  return currentIndex >= targetIndex;
}

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setError("");

      try {
        const [plansResponse, userResponse] = await Promise.allSettled([getPlans(), getMe()]);

        if (!mounted) return;

        if (plansResponse.status === "fulfilled") {
          const responsePlans = Array.isArray(plansResponse.value?.plans)
            ? plansResponse.value.plans
            : Array.isArray(plansResponse.value)
              ? plansResponse.value
              : [];
          setPlans(responsePlans);
        } else {
          setError(plansResponse.reason?.message || "Failed to load plans");
        }

        if (userResponse.status === "fulfilled") {
          setCurrentUser(userResponse.value?.user || userResponse.value || null);
        } else if (!plansResponse.status === "fulfilled") {
          setError(userResponse.reason?.message || "Failed to load account");
        }
      } finally {
        if (mounted) {
          setLoadingPlans(false);
          setLoadingUser(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const currentPlan = useMemo(() => {
    return currentUser?.plan || currentUser?.subscription?.plan || currentUser?.role || "free";
  }, [currentUser]);

  const handleCheckout = async (plan) => {
    setError("");
    setSuccessMessage("");

    try {
      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Razorpay checkout is not loaded yet. Please try again.");
      }

      setCheckoutLoading(getPlanKey(plan));

      const orderResponse = await createPaymentOrder(getPlanKey(plan));
      const order = orderResponse?.order || orderResponse;
      const razorpayKey = orderResponse?.key || orderResponse?.razorpayKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error("Missing Razorpay key configuration");
      }

      const options = {
        key: razorpayKey,
        amount: order?.amount,
        currency: order?.currency || "INR",
        name: "TEKLA AI",
        description: `Upgrade to ${plan.name}`,
        order_id: order?.id || order?.orderId,
        prefill: {
          name: currentUser?.name || "",
          email: currentUser?.email || "",
        },
        handler: async function (response) {
          const verificationPayload = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId: getPlanKey(plan),
          };

          const verificationResponse = await verifyPayment(verificationPayload);
          const updatedUser = verificationResponse?.user || verificationResponse?.data?.user || verificationResponse?.userData;

          if (updatedUser) {
            setCurrentUser(updatedUser);
          } else {
            setCurrentUser((previousUser) => ({
              ...(previousUser || {}),
              plan: plan.name,
              subscription: {
                ...((previousUser && previousUser.subscription) || {}),
                plan: getPlanKey(plan),
                status: "active",
              },
            }));
          }

          setSuccessMessage(`Your ${plan.name} plan is now active.`);
        },
        theme: {
          color: "#22d3ee",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (checkoutError) {
      setError(checkoutError.message || "Unable to start checkout");
    } finally {
      setCheckoutLoading("");
    }
  };

  const activePlanLabel = currentUser?.plan || currentUser?.subscription?.plan || "Free";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm font-medium text-cyan-300">
            Pricing
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Choose the subscription that fits your growth
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Start on the free plan, upgrade instantly with Razorpay, and unlock premium features without leaving the page.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Current plan</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {loadingUser ? "Loading..." : activePlanLabel}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {currentUser?.email ? `Signed in as ${currentUser.email}` : "Sign in to manage your subscription"}
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3">
          {loadingPlans ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300 md:col-span-3">
              Loading plans...
            </div>
          ) : (
            plans.map((plan) => {
              const planKey = getPlanKey(plan);
              const isCurrent = planKey === getPlanKey(currentPlan);
              const isHigherOrSame = isCurrentPlanHigher(currentPlan, plan);

              return (
                <article
                  key={plan.id || planKey || plan.name}
                  className={`flex h-full flex-col rounded-2xl border p-6 shadow-lg ${
                    plan.featured || plan.accent
                      ? "border-cyan-400/60 bg-cyan-400/10 ring-1 ring-cyan-400/30"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-semibold">{plan.name}</h2>
                        <p className="mt-2 text-sm text-slate-300">
                          {plan.description || "Subscription plan with premium access."}
                        </p>
                      </div>
                      {isCurrent ? (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                          Active
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-3xl font-bold">{formatCurrency(plan)}</p>
                    {plan.period ? <p className="mt-1 text-sm text-slate-400">{plan.period}</p> : null}
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-slate-200">
                    {(plan.features || []).map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-cyan-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-8">
                    {planKey === "free" ? (
                      <div className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
                        {isCurrent ? "Current plan" : "Included"}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCheckout(plan)}
                        disabled={checkoutLoading === planKey || isCurrent || isHigherOrSame}
                        className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                          plan.featured || plan.accent
                            ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-400/40"
                            : "border border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-400"
                        }`}
                      >
                        {checkoutLoading === planKey
                          ? "Opening checkout..."
                          : isCurrent
                            ? "Current plan"
                            : isHigherOrSame
                              ? "Already active"
                              : `Upgrade to ${plan.name}`}
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Need something different? We can tailor a custom subscription for usage, support, and onboarding requirements.
        </div>
      </section>
    </main>
  );
}