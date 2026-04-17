import Link from 'next/link';
import ProjectHistoryTable from '../../../components/ProjectHistoryTable';
import { getProjectHistory } from '../../../lib/api';

export const dynamic = 'force-dynamic';

async function loadHistory() {
  try {
    const response = await getProjectHistory();
    const history = Array.isArray(response?.data) ? response.data : Array.isArray(response?.history) ? response.history : Array.isArray(response) ? response : [];
    return {
      history
    };
  } catch (error) {
    return {
      history: [],
      error: error.message
    };
  }
}

export default async function ProjectHistoryPage() {
  const { history, error } = await loadHistory();

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Project history</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Previous estimates</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Review historic estimates, open details, and download PDF copies for clients.</p>
          </div>
          <div className="flex gap-3">
            <Link className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10" href="/admin/leads">
              Back to leads
            </Link>
            <Link className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10" href="/admin/dashboard">
              Dashboard
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Failed to load project history: {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-5 shadow-glow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Saved estimates</h2>
              <p className="text-sm text-[var(--muted)]">Date, cost, and location are shown for each estimate linked to the signed-in user.</p>
            </div>
          </div>
          <ProjectHistoryTable
            history={history}
            onViewDetails={(item) => {
              window.location.href = `/admin/leads/${item.id}`;
            }}
            onDownloadPdf={() => {
              // Hook for PDF download implementation.
            }}
            emptyMessage="No previous estimates found for this account."
          />
        </section>
      </div>
    </main>
  );
}
