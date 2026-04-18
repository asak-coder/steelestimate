import { formatCurrency, formatDateTime } from '../lib/format';

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{title}</h3>
      <div className="mt-4 text-sm text-white">{children}</div>
    </section>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.65)] p-4">
      <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</span>
      <span className="text-sm text-white">{value ?? '—'}</span>
    </div>
  );
}

function LeadDetailsPanel({ lead, onStatusChange }) {
  if (!lead) return null;

  const inputData = lead.projectData || {};
  const boq = lead.boq || {};
  const cost = lead.cost || {};

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-6 shadow-glow">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">{lead.clientName || inputData.projectName || inputData.name || 'Untitled Lead'}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{lead.email || lead.phone || inputData.email || inputData.phone || lead._id}</p>
          </div>
          {onStatusChange ? (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/20"
              onClick={() => onStatusChange(lead)}
            >
              Update status
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KeyValue label="Status" value={lead.status} />
          <KeyValue label="Score" value={typeof lead.score === 'number' ? `${lead.score} / 100` : '—'} />
          <KeyValue label="Tag" value={lead.tag} />
          <KeyValue label="Created" value={formatDateTime(lead.createdAt)} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Input data">
          <pre className="overflow-auto rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] p-4 text-xs leading-6 text-cyan-100">
            {JSON.stringify(inputData, null, 2)}
          </pre>
        </Section>

        <Section title="BOQ & cost">
          <div className="grid gap-4 sm:grid-cols-2">
            <KeyValue label="Total cost" value={formatCurrency(cost.totalCost || cost.finalCost || cost.estimatedCost)} />
            <KeyValue label="Optimized price" value={formatCurrency(lead.optimizedPrice)} />
            <KeyValue label="Margin suggestion" value={lead.marginSuggestion ? JSON.stringify(lead.marginSuggestion) : '—'} />
            <KeyValue label="Pricing justification" value={lead.pricingJustification || '—'} />
          </div>
          <div className="mt-4 overflow-auto rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] p-4 text-xs leading-6 text-cyan-100">
            <pre>{JSON.stringify(boq, null, 2)}</pre>
          </div>
        </Section>
      </div>

      <Section title="Quotation text">
        <div className="whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] p-4 text-sm leading-7 text-white">
          {lead.quotationText || 'No quotation text available.'}
        </div>
      </Section>
    </div>
  );
}

export default LeadDetailsPanel;