import Link from 'next/link';
import { formatCurrency, formatDateTime } from '../lib/format';

function ProjectHistoryTable({ history = [], onViewDetails, onDownloadPdf, emptyMessage = 'No project history found.' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] shadow-glow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)]">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            <tr>
              <th className="px-5 py-4 font-semibold">Date</th>
              <th className="px-5 py-4 font-semibold">Cost</th>
              <th className="px-5 py-4 font-semibold">Location</th>
              <th className="px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {history.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-sm text-[var(--muted)]" colSpan={4}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id} className="bg-transparent transition hover:bg-white/5">
                  <td className="px-5 py-4 align-top text-sm text-white">{formatDateTime(item.date)}</td>
                  <td className="px-5 py-4 align-top text-sm text-white">{formatCurrency(item.cost?.totalCost || item.cost?.finalCost || item.cost?.estimatedCost || item.optimizedPrice)}</td>
                  <td className="px-5 py-4 align-top text-sm text-[var(--muted)]">{item.location}</td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-lg border border-[var(--border)] bg-white/5 px-3 py-2 text-sm text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
                        href={`/admin/leads/${item.id}`}
                      >
                        View details
                      </Link>
                      <button
                        type="button"
                        className="rounded-lg border border-[var(--border)] bg-white/5 px-3 py-2 text-sm text-white transition hover:border-emerald-400/50 hover:bg-emerald-400/10"
                        onClick={() => onDownloadPdf?.(item)}
                      >
                        Download PDF
                      </button>
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

export default ProjectHistoryTable;
