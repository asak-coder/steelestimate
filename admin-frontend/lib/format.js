function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(number);
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium'
  }).format(date);
}

function pickLeadLabel(status) {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'won' || normalized === 'closed-won') return 'Won';
  if (normalized === 'lost' || normalized === 'closed-lost') return 'Lost';
  if (normalized === 'follow-up' || normalized === 'follow_up') return 'Follow-up';
  if (normalized === 'qualified') return 'Qualified';
  if (normalized === 'new') return 'New';

  return status || 'Unknown';
}

export {
  formatCurrency,
  formatDateTime,
  formatDate,
  pickLeadLabel
};
