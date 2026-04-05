import StatCard from '../../../../components/StatCard';
import LeadTable from '../../../../components/LeadTable';
import { getAdminStats, getLeads } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/format';

export const dynamic = 'force-dynamic';

async function loadDashboardData() {
  try {
    const statsResponse = await getAdminStats();

    const stats = statsResponse?.data || statsResponse || {};
    const recentLeads = Array.isArray(stats.recentLeads) ? stats.recentLeads.slice(0, 5) : [];

    return {
      stats,
      recentLeads
    };
  } catch (error) {
    return {
      stats: {
        totalLeads: 0,
        totalEstimatedRevenue: 0,
        conversionRate: 0,
        conversionCount: 0
      },
      recentLeads: [],
      error: error.message
    };
  }
}

export default async function AdminDashboardPage() {
  const { stats, recentLeads, error } = await loadDashboardData();

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Operations overview</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Monitor lead volume, estimated revenue and active pipeline performance.</p>
          </div>
          <div className="flex gap-3">
            <a className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10" href="/admin/leads">
              View all leads
            </a>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Data fetch fallback enabled: {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Leads" value={stats.totalLeads ?? 0} hint="All tracked opportunities" />
          <StatCard title="Total Revenue Estimate" value={formatCurrency(stats.totalEstimatedRevenue ?? 0)} hint="Projected pipeline value" accent="success" />
          <StatCard title="Conversion %" value={`${Number(stats.conversionRate || 0).toFixed(1)}%`} hint="Won / total leads" accent="warning" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Recent leads</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Latest opportunities entering the pipeline.</p>
            </div>
            <LeadTable leads={recentLeads} emptyMessage="No recent leads available." />
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-6 shadow-glow">
            <h2 className="text-xl font-semibold text-white">Pipeline snapshot</h2>
            <div className="mt-6 space-y-4 text-sm text-[var(--muted)]">
              <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Revenue target</div>
                <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(stats.totalEstimatedRevenue ?? 0)}</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Conversion %</div>
                <div className="mt-2 text-2xl font-semibold text-white">{Number(stats.conversionRate || 0).toFixed(1)}%</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Status coverage</div>
                <div className="mt-2 text-sm text-white">Use the leads page to filter by status and review all records.</div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
