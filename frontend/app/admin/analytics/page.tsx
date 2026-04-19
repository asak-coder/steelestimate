"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatCard from "../../../components/StatCard";
import { hasValidSession, onAuthChange } from "../../../lib/auth";
import { getAnalyticsSummary } from "../../../lib/api";

type MonthlyTrendPoint = {
  month?: string;
  count?: number;
  margin?: number;
};

type AnalyticsSummary = {
  totalEstimates?: number;
  avgMargin?: number;
  lossRate?: number;
  psuPerformance?: {
    count?: number;
    avgMargin?: number;
    lossRate?: number;
  };
  privatePerformance?: {
    count?: number;
    avgMargin?: number;
    lossRate?: number;
  };
  highRiskProjectCount?: number;
  monthlyTrend?: MonthlyTrendPoint[];
};

type AnalyticsResponse = {
  data?: AnalyticsSummary;
  success?: boolean;
  message?: string;
};

type AnalyticsSummaryData = AnalyticsSummary;

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}%`;
}

function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value));
}

function normalizeTrend(trend: unknown): MonthlyTrendPoint[] {
  if (!Array.isArray(trend)) return [];
  return trend
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as MonthlyTrendPoint;
      return {
        month: typeof entry.month === "string" ? entry.month : undefined,
        count: typeof entry.count === "number" ? entry.count : Number(entry.count ?? 0),
        margin: typeof entry.margin === "number" ? entry.margin : Number(entry.margin ?? 0),
      };
    })
    .filter(Boolean) as MonthlyTrendPoint[];
}

function MiniTrendChart({
  title,
  series,
  unit = "",
}: {
  title: string;
  series: MonthlyTrendPoint[];
  unit?: string;
}) {
  const maxValue = Math.max(
    1,
    ...series.map((point) => {
      const value = typeof point.count === "number" ? point.count : typeof point.margin === "number" ? point.margin : 0;
      return Number.isFinite(value) ? value : 0;
    })
  );

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-5 shadow-glow backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Monthly trend from analytics summary.</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-1 text-xs text-slate-300">
          {unit || "Trend"}
        </span>
      </div>

      {series.length > 0 ? (
        <div className="mt-5 flex h-48 items-end gap-3">
          {series.map((point, index) => {
            const rawValue = typeof point.count === "number" ? point.count : typeof point.margin === "number" ? point.margin : 0;
            const height = `${Math.max(8, (rawValue / maxValue) * 100)}%`;

            return (
              <div key={`${point.month || "month"}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-cyan-400/70 to-cyan-300/20"
                    style={{ height }}
                    title={`${point.month || "Month"}: ${rawValue}${unit}`}
                  />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-slate-200">{point.month || `M${index + 1}`}</div>
                  <div className="text-[11px] text-[var(--muted)]">
                    {Number.isFinite(rawValue) ? `${rawValue.toFixed(unit === "%" ? 1 : 0)}${unit}` : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-white/5 p-8 text-center text-sm text-[var(--muted)]">
          No monthly trend data available yet.
        </div>
      )}
    </div>
  );
}

function ComparisonCard({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  hint,
}: {
  title: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-5 shadow-glow backdrop-blur">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{leftLabel}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{leftValue}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{rightLabel}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{rightValue}</div>
        </div>
      </div>
      {hint ? <p className="mt-3 text-sm text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalEstimates: 0,
    avgMargin: 0,
    lossRate: 0,
    highRiskProjectCount: 0,
    monthlyTrend: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [ready, setReady] = useState(false);

  const trend = useMemo(() => normalizeTrend(summary.monthlyTrend), [summary.monthlyTrend]);

  useEffect(() => {
    if (!hasValidSession()) return;

    const guard = () => {
      if (!hasValidSession()) {
        window.location.replace("/admin/login?next=/admin/analytics");
        return;
      }

      setReady(true);
    };

    guard();

    const unsubscribe = onAuthChange(() => {
      guard();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!ready) return;

    async function fetchSummary() {
      setLoading(true);
      setError("");

      try {
        const response: AnalyticsResponse = await getAnalyticsSummary();
        const data: AnalyticsSummaryData = response?.data || {};

        setSummary({
          totalEstimates: Number(data.totalEstimates ?? 0),
          avgMargin: Number(data.avgMargin ?? 0),
          lossRate: Number(data.lossRate ?? 0),
          psuPerformance: data.psuPerformance || { count: 0, avgMargin: 0, lossRate: 0 },
          privatePerformance: data.privatePerformance || { count: 0, avgMargin: 0, lossRate: 0 },
          highRiskProjectCount: Number(data.highRiskProjectCount ?? 0),
          monthlyTrend: normalizeTrend(data.monthlyTrend),
        });
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          window.location.replace("/admin/login?next=/admin/analytics");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load analytics summary");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [ready]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-300">
          Verifying session...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Admin analytics</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Estimate performance overview</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Review overall estimate volume, margin health, loss rate, and project risk signals.
            </p>
          </div>

          <Link
            className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
            href="/admin/dashboard"
          >
            Back to dashboard
          </Link>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Error: {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total estimates" value={formatCount(summary.totalEstimates)} hint={loading ? "Loading latest summary..." : "All authenticated estimate records"} />
          <StatCard title="Avg margin" value={formatPercent(summary.avgMargin)} hint="Average margin across completed estimates" accent="success" />
          <StatCard title="Loss rate" value={formatPercent(summary.lossRate)} hint="Share of estimates below target margin" accent="warning" />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ComparisonCard
            title="PSU vs Private performance"
            leftLabel="PSU avg margin"
            leftValue={formatPercent(summary.psuPerformance?.avgMargin)}
            rightLabel="Private avg margin"
            rightValue={formatPercent(summary.privatePerformance?.avgMargin)}
            hint={`PSU count: ${formatCount(summary.psuPerformance?.count)} · Private count: ${formatCount(summary.privatePerformance?.count)}`}
          />

          <div className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-5 shadow-glow backdrop-blur">
            <h2 className="text-lg font-semibold text-white">Risk snapshot</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">High-risk projects</div>
                <div className="mt-2 text-2xl font-semibold text-white">{formatCount(summary.highRiskProjectCount)}</div>
                <p className="mt-2 text-sm text-[var(--muted)]">Projects flagged with elevated commercial or execution risk.</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Loss signals</div>
                <div className="mt-2 text-2xl font-semibold text-white">{formatPercent(summary.lossRate)}</div>
                <p className="mt-2 text-sm text-[var(--muted)]">Monitor pricing discipline and edge cases that erode margins.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <MiniTrendChart title="Monthly estimate volume" series={trend.map((point) => ({ month: point.month, count: point.count }))} unit="" />
          <MiniTrendChart title="Monthly margin trend" series={trend.map((point) => ({ month: point.month, margin: point.margin }))} unit="%" />
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-5 shadow-glow backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Summary notes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total estimates</div>
              <p className="mt-2 text-sm text-slate-200">
                Use this to track the size of your active pricing funnel and validate growth.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Average margin</div>
              <p className="mt-2 text-sm text-slate-200">
                A quick indicator of commercial quality and how well margins are preserved.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Loss rate</div>
              <p className="mt-2 text-sm text-slate-200">
                Helps identify how often estimates fall into unprofitable territory.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
