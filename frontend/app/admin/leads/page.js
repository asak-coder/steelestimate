import Link from 'next/link';
import LeadTable from '../../../components/LeadTable';
import { getLeads } from '../../../lib/api';
import { formatDate } from '../../../lib/format';
import { hasValidSession } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

async function loadLeads(searchParams) {
  const status = typeof searchParams?.status === 'string' ? searchParams.status : 'all';
  const from = typeof searchParams?.from === 'string' ? searchParams.from : '';
  const to = typeof searchParams?.to === 'string' ? searchParams.to : '';
  const search = typeof searchParams?.search === 'string' ? searchParams.search : '';
  const score = typeof searchParams?.score === 'string' ? searchParams.score : '';

  try {
    const response = await getLeads({ status, from, to, search, score });
    const leads = Array.isArray(response?.data) ? response.data : Array.isArray(response?.leads) ? response.leads : Array.isArray(response) ? response : [];
    return {
      leads,
      filters: { status, from, to, search, score }
    };
  } catch (error) {
    return {
      leads: [],
      filters: { status, from, to, search, score },
      error: error.message
    };
  }
}

export default async function LeadsPage({ searchParams }) {
  const { leads, filters, error } = await loadLeads(searchParams);

  if (typeof window !== 'undefined' && !hasValidSession()) {
    window.location.replace('/admin/login?next=/admin/leads');
    return null;
  }

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Lead management</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">All leads</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Filter the pipeline by status, date, score, and search fields to review quotation performance.</p>
          </div>
          <Link className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10" href="/admin/dashboard">
            Back to dashboard
          </Link>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Failed to load leads: {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-5 shadow-glow">
          <form className="grid gap-4 md:grid-cols-5" method="get">
            <label className="flex flex-col gap-2 text-sm text-white">
              Search
              <input className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" name="search" type="text" defaultValue={filters.search} placeholder="Name, phone, email" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white">
              Status
              <select className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" name="status" defaultValue={filters.status}>
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="qualified">Qualified</option>
                <option value="follow-up">Follow-up</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white">
              From
              <input className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" name="from" type="date" defaultValue={filters.from} />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white">
              To
              <input className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" name="to" type="date" defaultValue={filters.to} />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white">
              Score
              <input className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" name="score" type="number" min="0" max="100" defaultValue={filters.score} />
            </label>
            <div className="flex items-end gap-3 md:col-span-5">
              <button type="submit" className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                Apply filters
              </button>
            </div>
          </form>
          {(filters.status !== 'all' || filters.from || filters.to || filters.search || filters.score) ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              {filters.status !== 'all' ? <span className="rounded-full border border-[var(--border)] px-3 py-1">Status: {filters.status}</span> : null}
              {filters.from ? <span className="rounded-full border border-[var(--border)] px-3 py-1">From: {formatDate(filters.from)}</span> : null}
              {filters.to ? <span className="rounded-full border border-[var(--border)] px-3 py-1">To: {formatDate(filters.to)}</span> : null}
              {filters.search ? <span className="rounded-full border border-[var(--border)] px-3 py-1">Search: {filters.search}</span> : null}
              {filters.score ? <span className="rounded-full border border-[var(--border)] px-3 py-1">Score: {filters.score}</span> : null}
            </div>
          ) : null}
        </section>

        <LeadTable leads={leads} emptyMessage="No leads match the selected filters." />
      </div>
    </main>
  );
}