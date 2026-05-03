'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import AdminNav from '../../../components/admin/AdminNav';
import {
  getAdminSecurityEvents,
  getAdminSecurityLive,
  getAdminSecurityLogins,
  getAdminSecuritySummary
} from '../../../lib/api';
import { API_BASE_URL } from '../../../lib/apiClient';
import { getAccessToken } from '../../../lib/authStore';

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function severityClass(severity) {
  if (severity === 'CRITICAL') return 'bg-red-100 text-red-800';
  if (severity === 'HIGH') return 'bg-orange-100 text-orange-800';
  if (severity === 'MEDIUM') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

export default function AdminSecurityPage() {
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pageInfo, setPageInfo] = useState(null);
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
          ip: filters.ip,
          limit: 75
        };
        const [eventPage, loginPage, summaryData, liveData] = await Promise.all([
          getAdminSecurityEvents(params),
          getAdminSecurityLogins(params),
          getAdminSecuritySummary(params),
          getAdminSecurityLive()
        ]);

        if (!cancelled) {
          setEvents(eventPage.items || []);
          setPageInfo(eventPage.pageInfo || null);
          setLogs(loginPage.items || []);
          setSummary(summaryData || null);
          setLiveAlerts(liveData.events || []);
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

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return undefined;

    const socket = io(API_BASE_URL, {
      path: '/socket.io',
      withCredentials: true,
      auth: { token }
    });

    socket.on('security:event', (event) => {
      setLiveAlerts((current) => [event, ...current].slice(0, 25));
      setEvents((current) => [event, ...current].slice(0, 100));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loginRatio = useMemo(() => {
    const success = logs.filter((log) => log.status === 'SUCCESS').length;
    const failed = logs.filter((log) => ['FAILED', 'LOCKED', '2FA_FAILED'].includes(log.status)).length;
    return [
      { name: 'Success', count: success },
      { name: 'Failed', count: failed }
    ];
  }, [logs]);

  const timeline = useMemo(() => {
    const buckets = new Map();
    logs.forEach((log) => {
      const date = new Date(log.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit' });
      const current = buckets.get(key) || { time: key, success: 0, failed: 0 };
      if (log.status === 'SUCCESS') current.success += 1;
      else current.failed += 1;
      buckets.set(key, current);
    });
    return [...buckets.values()].slice(-12);
  }, [logs]);

  async function loadMoreEvents() {
    if (!pageInfo?.nextCursor) return;
    const eventPage = await getAdminSecurityEvents({
      ...filters,
      cursor: pageInfo.nextCursor,
      limit: 75
    });
    setEvents((current) => [...current, ...(eventPage.items || [])]);
    setPageInfo(eventPage.pageInfo || null);
  }

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

        <section className="mb-6 rounded-lg border border-red-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Live alerts</h2>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              {liveAlerts.length} active
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {(liveAlerts.length ? liveAlerts : []).slice(0, 3).map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 p-3">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${severityClass(event.severity)}`}>
                  {event.severity}
                </span>
                <p className="mt-2 text-sm font-medium text-slate-900">{event.type.replaceAll('_', ' ')}</p>
                <p className="mt-1 text-xs text-slate-500">{event.message}</p>
              </div>
            ))}
            {!liveAlerts.length && <p className="text-sm text-slate-500">No live critical alerts.</p>}
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={filters.severity} onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <input type="text" value={filters.ip} onChange={(event) => setFilters((current) => ({ ...current, ip: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="IP address" />
          </div>
        </section>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            ['Recent critical', summary?.recentCritical ?? 0],
            ['Security events', events.length],
            ['Login records', logs.length]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{loading ? '-' : value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Login attempts over time</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="success" stackId="a" fill="#10b981" />
                  <Bar dataKey="failed" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Failed vs success ratio</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loginRatio}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f172a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold">Recent events</h2>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-sm text-slate-500">Loading events...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {events.map((event) => (
                <div key={event.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[140px_180px_1fr_150px_150px] lg:items-center">
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${severityClass(event.severity)}`}>
                    {event.severity}
                  </span>
                  <p className="text-sm font-medium text-slate-900">{event.type.replaceAll('_', ' ')}</p>
                  <p className="text-sm text-slate-600">{event.message}</p>
                  <p className="text-sm text-slate-500">{event.ip || 'Unknown IP'}</p>
                  <p className="text-xs text-slate-500">{formatDate(event.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
          {pageInfo?.hasMore ? (
            <div className="border-t border-slate-200 p-4">
              <button onClick={loadMoreEvents} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Load more
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
