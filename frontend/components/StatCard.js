function StatCard({ title, value, hint, accent = 'primary' }) {
  const accentStyles = {
    primary: 'from-cyan-400/25 to-cyan-500/5 text-cyan-300',
    success: 'from-emerald-400/25 to-emerald-500/5 text-emerald-300',
    warning: 'from-amber-400/25 to-amber-500/5 text-amber-300',
    danger: 'from-rose-400/25 to-rose-500/5 text-rose-300'
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-5 shadow-glow backdrop-blur">
      <div className={`mb-4 inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold ${accentStyles[accent] || accentStyles.primary}`}>
        {title}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-white">{value}</div>
      {hint ? <p className="mt-2 text-sm text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

module.exports = StatCard;