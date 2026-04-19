"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../../../components/admin/AdminNav";
import { getAdminSubscriptions } from "../../../lib/api";
import { hasValidSession, onAuthChange } from "../../../lib/auth";

const SUBSCRIPTIONS_PATH = "/admin/subscriptions";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object") {
    return toNumber(value.amount ?? value.value ?? value.total ?? value.price ?? value.cost ?? 0);
  }
  return 0;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasValidSession()) {
      router.replace(`${"/admin/login"}?next=${encodeURIComponent(SUBSCRIPTIONS_PATH)}`);
      return undefined;
    }

    setIsReady(true);
    const unsubscribe = onAuthChange(() => {
      if (!hasValidSession()) {
        router.replace(`${"/admin/login"}?next=${encodeURIComponent(SUBSCRIPTIONS_PATH)}`);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [router]);

  useEffect(() => {
    if (!isReady) return undefined;

    let cancelled = false;

    async function loadSubscriptions() {
      setLoading(true);
      setError("");

      try {
        const response = await getAdminSubscriptions();
        const payload = response?.data ?? response ?? {};
        const list = Array.isArray(payload.subscriptions)
          ? payload.subscriptions
          : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload)
          ? payload
          : [];

        if (!cancelled) {
          setSubscriptions(list);
          setSummary(payload.summary ?? payload.metrics ?? payload.stats ?? {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load subscriptions.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSubscriptions();

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  const normalizedSubscriptions = useMemo(() => {
    return subscriptions.map((subscription, index) => {
      const planType = subscription?.planType ?? subscription?.plan?.name ?? subscription?.plan ?? "Free";
      const premium = Boolean(subscription?.premium ?? subscription?.isPremium ?? String(planType).toLowerCase() !== "free");
      const status = subscription?.status ?? (premium ? "active" : "inactive");

      return {
        id: subscription?.id ?? subscription?._id ?? subscription?.subscriptionId ?? `${subscription?.userId ?? "subscription"}-${subscription?.startDate ?? index}`,
        userId: subscription?.userId ?? subscription?.user?._id ?? subscription?.user?.id ?? "—",
        name: subscription?.name ?? subscription?.userName ?? subscription?.user?.name ?? "Unnamed user",
        planType,
        status,
        premium,
        startDate: subscription?.startDate ?? subscription?.subscription?.startDate ?? null,
        endDate: subscription?.endDate ?? subscription?.subscription?.endDate ?? null,
        amount: subscription?.amount ?? subscription?.price ?? subscription?.subscription?.amount ?? 0,
      };
    });
  }, [subscriptions]);

  const metrics = useMemo(() => {
    const activeCount =
      summary?.activeSubscriptions ??
      summary?.activeCount ??
      normalizedSubscriptions.filter((item) => String(item.status).toLowerCase() === "active").length;
    const premiumCount =
      summary?.premiumUsers ??
      summary?.premiumCount ??
      normalizedSubscriptions.filter((item) => item.premium).length;
    const totalRevenue =
      summary?.totalRevenue ??
      summary?.revenue ??
      normalizedSubscriptions.reduce((sum, item) => sum + toNumber(item.amount), 0);

    return {
      totalSubscriptions: toNumber(summary?.totalSubscriptions ?? normalizedSubscriptions.length),
      activeCount: toNumber(activeCount),
      premiumCount: toNumber(premiumCount),
      totalRevenue: toNumber(totalRevenue),
    };
  }, [normalizedSubscriptions, summary]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Checking admin session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Admin management</p>
          <div className="mt-2">
            <h1 className="text-3xl font-semibold text-slate-900">Subscriptions</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review plan activity, premium status, and subscription timing.
            </p>
          </div>
        </div>

        <AdminNav />

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total subscriptions</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{loading ? "—" : metrics.totalSubscriptions}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Active subscriptions</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{loading ? "—" : metrics.activeCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Premium users</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{loading ? "—" : metrics.premiumCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Revenue</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {loading
                ? "—"
                : new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(toNumber(metrics.totalRevenue))}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Premium</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">End date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      Loading subscriptions...
                    </td>
                  </tr>
                ) : normalizedSubscriptions.length > 0 ? (
                  normalizedSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">{subscription.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{subscription.userId}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{subscription.planType}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{subscription.status}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{subscription.premium ? "Yes" : "No"}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDate(subscription.startDate)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDate(subscription.endDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      No subscriptions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}