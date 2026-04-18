import Link from 'next/link';
import LeadDetailsPanel from '../../../../components/LeadDetailsPanel';
import { getLeadById, updateLeadNotes, updateLeadStatus } from '../../../../lib/api';

export const dynamic = 'force-dynamic';

async function loadLead(id) {
  try {
    const response = await getLeadById(id);
    return {
      lead: response?.data || response?.lead || response || null
    };
  } catch (error) {
    return {
      lead: null,
      error: error.message
    };
  }
}

export default async function LeadDetailsPage({ params }) {
  const { lead, error } = await loadLead(params.id);

  async function handleStatusUpdate(formData) {
    'use server';
    await updateLeadStatus(params.id, formData.get('status'));
  }

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Lead detail</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Record inspection</h1>
          </div>
          <Link className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10" href="/admin/leads">
            Back to leads
          </Link>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Failed to load lead: {error}
          </div>
        ) : null}

        {lead ? (
          <div className="space-y-6">
            <LeadDetailsPanel lead={lead} />

            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-6 shadow-glow">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <label className="flex w-full max-w-sm flex-col gap-2 text-sm text-white">
                  Update status
                  <select name="status" defaultValue={lead.status || 'new'} className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none">
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
                <button type="submit" formAction={handleStatusUpdate} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                  Update status
                </button>
              </div>

              <form className="mt-6 space-y-4" action={async (formData) => {
                'use server';
                await updateLeadNotes(params.id, formData.get('notes'));
              }}>
                <label className="flex flex-col gap-2 text-sm text-white">
                  Notes
                  <textarea name="notes" defaultValue={lead.notes || ''} className="min-h-32 rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" />
                </label>
                <button type="submit" className="rounded-xl border border-[var(--border)] bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10">
                  Save notes
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-6 text-sm text-[var(--muted)] shadow-glow">
            Lead not found.
          </div>
        )}
      </div>
    </main>
  );
}