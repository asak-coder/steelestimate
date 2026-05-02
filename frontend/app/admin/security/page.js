'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminNav from '../../../components/admin/AdminNav';
import { getLoginLogs, getSecurityEvents } from '../../../lib/api';

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export default function AdminSecurityPage() {
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    severity: '',
    ip: ''
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSecurity() {
      setLoading(true);
      setError('');
      try {
        const params = {
          from: filters.from,
          to: filters.to,
          severity: filters.severity,
          ip: filters.ip
        };
        const [loginLogs, securityEvents] = await Promise.all([getLoginLogs(params), getSecurityEvents(params)]);
        if (!cancelled) {
          setLogs(loginLogs);
          setEvents(securityEvents);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load security dashboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSecurity();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const summary = useMemo(() => {
    const failed = logs.filter((log) => log.status === 'FAILED').length;
    const success = logs.filter((log) => log.status === 'SUCCESS').length;
    return {
      failed,
      success,
      alerts: events.length
    };
  }, [events.length, logs]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Threat monitoring</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Security dashboard</h1>
        </div>

        <AdminNav />

        {error ? (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">From</span>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">To</span>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Severity</span>
              <select
                value={filters.severity}
                onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              >
                <option value="">All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">IP</span>
              <input
                type="text"
                value={filters.ip}
                onChange={(event) => setFilters((current) => ({ ...current, ip: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                placeholder="203.0.113.10"
              />
            </label>
          </div>
        </section>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            ['Successful logins', summary.success],
            ['Failed attempts', summary.failed],
            ['Active alerts', summary.alerts]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{loading ? '-' : value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Suspicious activity</h2>
            </div>
            {loading ? (
              <div className="px-5 py-8 text-sm text-slate-500">Loading alerts...</div>
            ) : events.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">No suspicious activity detected.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {events.map((event, index) => (
                  <div key={`${event.type}-${index}`} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">{event.type.replaceAll('_', ' ')}</p>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        {event.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{event.message}</p>
                    <p className="mt-2 text-xs text-slate-500">Last seen: {formatDate(event.lastSeen)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Login history</h2>
            </div>
            {loading ? (
              <div className="px-5 py-8 text-sm text-slate-500">Loading login history...</div>
            ) : logs.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">No login events captured.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {logs.slice(0, 100).map((log, index) => (
                  <div key={`${log.timestamp}-${index}`} className="grid gap-3 px-5 py-4 md:grid-cols-[110px_1fr_1fr_1.4fr] md:items-center">
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.status}
                    </span>
                    <p className="text-sm text-slate-700">{formatDate(log.timestamp)}</p>
                    <p className="text-sm text-slate-700">{log.ip || 'Unknown IP'}</p>
                    <p className="break-all text-xs text-slate-500">{log.userAgent || 'No user agent'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
