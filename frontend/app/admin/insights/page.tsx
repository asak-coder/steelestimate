'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type EstimateRecord = {
  _id?: string;
  id?: string;
  projectType?: string;
  finalAmount?: number | string;
  riskLevel?: string;
  recommendedMargin?: number | string;
  strategy?: string;
  winProbability?: number | string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
  insights?: string[] | string;
  boq?: unknown[];
  cost?: number | string;
  loss?: number | string;
  costBreakdown?: Record<string, number | string>;
  data?: {
    projectType?: string;
    finalAmount?: number | string;
    riskLevel?: string;
    recommendedMargin?: number | string;
    strategy?: string;
    winProbability?: number | string;
    costBreakdown?: Record<string, number | string>;
  };
};

type ApiResponse = {
  estimates?: EstimateRecord[];
  data?: EstimateRecord[];
  success?: boolean;
  message?: string;
};

const formatCurrency = (value: number | string | undefined | null) => {
  if (value === undefined || value === null || value === '') return '—';
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numericValue)) return String(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericValue);
};

const formatPercent = (value: number | string | undefined | null) => {
  if (value === undefined || value === null || value === '') return '—';
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numericValue)) return String(value);
  return `${numericValue}%`;
};

const getProjectType = (estimate: EstimateRecord) => estimate.projectType || estimate.data?.projectType || 'Unknown';
const getRiskLevel = (estimate: EstimateRecord) => estimate.riskLevel || estimate.data?.riskLevel || 'Unknown';
const getRecommendedMargin = (estimate: EstimateRecord) =>
  estimate.recommendedMargin ?? estimate.data?.recommendedMargin ?? null;
const getStrategy = (estimate: EstimateRecord) => estimate.strategy || estimate.data?.strategy || '—';
const getWinProbability = (estimate: EstimateRecord) =>
  estimate.winProbability ?? estimate.data?.winProbability ?? null;

export default function InsightsPage() {
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadEstimates = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/estimates', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        const data: ApiResponse = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load insights');
        }

        if (!isMounted) return;

        const list = Array.isArray(data.estimates)
          ? data.estimates
          : Array.isArray(data.data)
            ? data.data
            : [];

        setEstimates(list);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load insights');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEstimates();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const total = estimates.length;
    const highRisk = estimates.filter((item) => {
      const risk = getRiskLevel(item).toLowerCase();
      return risk.includes('high');
    }).length;
    const withStrategy = estimates.filter((item) => Boolean(getStrategy(item) && getStrategy(item) !== '—')).length;
    const averageMargin =
      estimates.length > 0
        ? estimates.reduce((sum, item) => {
            const value = Number(getRecommendedMargin(item));
            return Number.isNaN(value) ? sum : sum + value;
          }, 0) / estimates.length
        : 0;
    const averageWinProbability =
      estimates.length > 0
        ? estimates.reduce((sum, item) => {
            const value = Number(getWinProbability(item));
            return Number.isNaN(value) ? sum : sum + value;
          }, 0) / estimates.length
        : 0;

    return { total, highRisk, withStrategy, averageMargin, averageWinProbability };
  }, [estimates]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">Admin Insights</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Estimate intelligence dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Review pricing strategy, risk posture, recommended margin, and win probability patterns from recent estimate runs.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Back to dashboard
              </Link>
              <Link
                href="/admin/estimate"
                className="inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
              >
                Run estimate
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Total estimates</p>
              <p className="mt-2 text-2xl font-semibold text-white">{loading ? '—' : metrics.total}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">High risk projects</p>
              <p className="mt-2 text-2xl font-semibold text-white">{loading ? '—' : metrics.highRisk}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">With strategy</p>
              <p className="mt-2 text-2xl font-semibold text-white">{loading ? '—' : metrics.withStrategy}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Average margin</p>
              <p className="mt-2 text-2xl font-semibold text-white">{loading ? '—' : formatPercent(metrics.averageMargin.toFixed(2))}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Avg win probability</p>
              <p className="mt-2 text-2xl font-semibold text-white">{loading ? '—' : formatPercent(metrics.averageWinProbability.toFixed(2))}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-4 shadow-xl shadow-black/20 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Estimate insights</h2>
              <p className="mt-1 text-sm text-slate-500">
                Project type, final amount, risk level, recommended margin, strategy, and win probability.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {loading ? 'Loading…' : `${estimates.length} records`}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Unable to load insights</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse rounded-2xl border border-slate-200 p-4">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="mt-3 grid gap-3 sm:grid-cols-6">
                    <div className="h-10 rounded bg-slate-100" />
                    <div className="h-10 rounded bg-slate-100" />
                    <div className="h-10 rounded bg-slate-100" />
                    <div className="h-10 rounded bg-slate-100" />
                    <div className="h-10 rounded bg-slate-100" />
                    <div className="h-10 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : estimates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No estimates yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Once estimates are generated, they will appear here with their pricing guidance and risk signals.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Project type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Final amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Risk level</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Margin</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Win probability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {estimates.map((estimate, index) => (
                      <tr key={estimate._id || estimate.id || index} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">{getProjectType(estimate)}</div>
                          <div className="text-xs text-slate-500">{estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString() : ''}</div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-slate-900">{formatCurrency(estimate.finalAmount)}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                            {getRiskLevel(estimate)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">{formatPercent(getRecommendedMargin(estimate))}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{getStrategy(estimate)}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{formatPercent(getWinProbability(estimate))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {estimates.map((estimate, index) => (
                  <article key={estimate._id || estimate.id || index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{getProjectType(estimate)}</h3>
                        <p className="mt-1 text-sm text-slate-500">{estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString() : 'Recent estimate'}</p>
                      </div>
                      <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                        {getRiskLevel(estimate)}
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Final amount</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(estimate.finalAmount)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Margin</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">{formatPercent(getRecommendedMargin(estimate))}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Strategy</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">{getStrategy(estimate)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Win probability</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">{formatPercent(getWinProbability(estimate))}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}