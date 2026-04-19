"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminNav from "../../../components/admin/AdminNav";
import { getAdminStats } from "../../../lib/api";
import { hasValidSession, onAuthChange } from "../../../lib/auth";

const DASHBOARD_PATH = "/admin/dashboard";

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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatChartDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function normalizeSeries(series, valueKeys) {
  if (!Array.isArray(series)) return [];
  return series.map((item) => {
    const normalized = { ...item };
    normalized.date = formatChartDate(item?.date ?? item?._id ?? item?.label ?? item?.day);
    const firstKey = valueKeys.find((key) => item?.[key] !== undefined);
    normalized.value = toNumber(item?.[firstKey] ?? item?.value ?? item?.count ?? item?.revenue ?? 0);
    normalized.revenue = toNumber(item?.revenue ?? item?.value ?? item?.count ?? 0);
    return normalized;
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasValidSession()) {
      router.replace(`${"/admin/login"}?next=${encodeURIComponent(DASHBOARD_PATH)}`);
      return undefined;
    }

    setIsReady(true);
    const unsubscribe = onAuthChange(() => {
      if (!hasValidSession()) {
        router.replace(`${"/admin/login"}?next=${encodeURIComponent(DASHBOARD_PATH)}`);
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

    async function loadStats() {
      setLoading(true);
      setError("");

      try {
        const response = await getAdminStats();
        const payload = response?.data ?? response ?? {};
        if (!cancelled) {
          setStats(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load admin stats.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  const dashboardData = useMemo(() => {
    const payload = stats ?? {};
    const dailyUsage = normalizeSeries(payload.dailyUsage ?? payload.usageChart ?? [], [
      "value",
      "count",
      "users",
      "logins",
      "visits",
    ]);
    const revenueChart = normalizeSeries(payload.revenueChart ?? payload.revenueSeries ?? [], [
      "revenue",
      "value",
      "total",
    ]);

    return {
      totalUsers: toNumber(payload.totalUsers),
      totalLeads: toNumber(payload.totalLeads),
      totalRevenue: toNumber(payload.totalRevenue),
      activeUsers: toNumber(payload.activeUsers),
      dailyUsage,
      revenueChart,
    };
  }, [stats]);

  const cards = [
    {
      label: "Total users",
      value: dashboardData.totalUsers,
      helper: "All registered accounts",
    },
    {
      label: "Total leads",
      value: dashboardData.totalLeads,
      helper: "Captured opportunities",
    },
    {
      label: "Total revenue",
      value: formatCurrency(dashboardData.totalRevenue),
      helper: "From optimized pricing",
    },
    {
      label: "Active users",
      value: dashboardData.activeUsers,
      helper: "Premium or active plans",
    },
  ];

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
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Admin overview</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
              <p className="mt-2 text-sm text-slate-600">
                Monitor users, leads, revenue, and recent activity from one place.
              </p>
            </div>
          </div>
        </div>

        <AdminNav />

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{loading ? "—" : card.value}</p>
              <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Daily usage</h2>
              <p className="text-sm text-slate-500">Activity volume across the recent reporting window.</p>
            </div>
            <div className="h-80 w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
                  Loading chart...
                </div>
              ) : dashboardData.dailyUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.dailyUsage} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Usage"
                      stroke="#0f172a"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
                  No usage data available.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Revenue trend</h2>
              <p className="text-sm text-slate-500">Daily revenue derived from optimized and fallback price values.</p>
            </div>
            <div className="h-80 w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
                  Loading chart...
                </div>
              ) : dashboardData.revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.revenueChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#2563eb"
                      fill="#bfdbfe"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
                  No revenue data available.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}