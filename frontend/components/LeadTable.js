import Link from 'next/link';
import { formatCurrency, formatDateTime, pickLeadLabel } from '../lib/format';

function LeadTable({ leads = [], onStatusChange, emptyMessage = 'No leads found.' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] shadow-glow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)]">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            <tr>
              <th className="px-5 py-4 font-semibold">Lead</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Created</th>
              <th className="px-5 py-4 font-semibold">Estimated Revenue</th>
              <th className="px-5 py-4 font-semibold">Score</th>
              <th className="px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {leads.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-sm text-[var(--muted)]" colSpan={6}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead._id} className="bg-transparent transition hover:bg-white/5">
                  <td className="px-5 py-4 align-top">
                    <div className="font-medium text-white">{lead.clientName || lead.projectData?.projectName || lead.projectData?.name || 'Untitled Lead'}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">{lead.email || lead.phone || lead.projectData?.email || lead.projectData?.phone || lead._id}</div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="inline-flex rounded-full border border-[var(--border)] bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                      {pickLeadLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-[var(--muted)]">{formatDateTime(lead.createdAt)}</td>
                  <td className="px-5 py-4 align-top text-sm text-white">{formatCurrency(lead.optimizedPrice || lead.cost?.totalCost || lead.cost?.finalCost || lead.cost?.estimatedCost)}</td>
                  <td className="px-5 py-4 align-top text-sm text-white">{typeof lead.score === 'number' ? lead.score : '—'}</td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <Link className="rounded-lg border border-[var(--border)] bg-white/5 px-3 py-2 text-sm text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10" href={`/admin/leads/${lead._id}`}>
                        View
                      </Link>
                      {onStatusChange ? (
                        <button
                          type="button"
                          className="rounded-lg border border-[var(--border)] bg-white/5 px-3 py-2 text-sm text-white transition hover:border-emerald-400/50 hover:bg-emerald-400/10"
                          onClick={() => onStatusChange(lead)}
                        >
                          Update
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeadTable;
