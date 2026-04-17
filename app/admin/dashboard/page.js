'use client';

import { useEffect, useState } from 'react';
import StatCard from '../../../components/StatCard';
import LeadTable from '../../../components/LeadTable';
import { getAdminStats } from '../../../lib/api';
import { formatCurrency } from '../../../lib/format';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalEstimatedRevenue: 0,
    conversionRate: 0,
    conversionCount: 0,
    statusCounts: {
      NEW: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      REJECTED: 0
    }
  });

  const [recentLeads, setRecentLeads] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getAdminStats();
        const data = res?.data || res || {};

        setStats({
          totalLeads: data.totalLeads ?? 0,
          totalEstimatedRevenue: data.totalEstimatedRevenue ?? 0,
          conversionRate: data.conversionRate ?? 0,
          conversionCount: data.conversionCount ?? 0,
          statusCounts: data.statusCounts || {}
        });

        setRecentLeads(data.recentLeads || []);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchData();
  }, []);

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Operations overview</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Monitor lead volume, estimated revenue and active pipeline performance.
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Error: {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Leads" value={stats.totalLeads} />
          <StatCard title="Revenue" value={formatCurrency(stats.totalEstimatedRevenue)} />
          <StatCard title="Conversion %" value={`${Number(stats.conversionRate).toFixed(1)}%`} />
        </section>

        <LeadTable leads={recentLeads} />
      </div>
    </main>
  );
}