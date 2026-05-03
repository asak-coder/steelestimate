'use client';

import { useEffect, useState } from 'react';
import AdminNav from '../../../components/admin/AdminNav';
import { getSessions, revokeSession } from '../../../lib/api';

function formatDate(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function deviceName(userAgent = '') {
  if (!userAgent) return 'Unknown device';
  if (/iphone|ipad/i.test(userAgent)) return 'iOS device';
  if (/android/i.test(userAgent)) return 'Android device';
  if (/windows/i.test(userAgent)) return 'Windows workstation';
  if (/macintosh|mac os/i.test(userAgent)) return 'Mac workstation';
  if (/linux/i.test(userAgent)) return 'Linux workstation';
  return 'Browser session';
}

function isSuspicious(session) {
  return Boolean(session.geo?.country && session.geo.country !== 'IN');
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revokingSessionId, setRevokingSessionId] = useState('');

  async function loadSessions() {
    setLoading(true);
    setError('');
    try {
      setSessions(await getSessions());
    } catch (err) {
      setError(err?.message || 'Unable to load active sessions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function handleRevoke(refreshTokenId) {
    setRevokingSessionId(refreshTokenId);
    setError('');
    try {
      await revokeSession(refreshTokenId);
      setSessions((items) => items.filter((item) => item.refreshTokenId !== refreshTokenId));
    } catch (err) {
      setError(err?.message || 'Unable to revoke session.');
    } finally {
      setRevokingSessionId('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Access control</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Active sessions</h1>
        </div>

        <AdminNav />

        {error ? (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold">Session inventory</h2>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-sm text-slate-500">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">No active sessions.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {sessions.map((session) => (
                <div key={session.refreshTokenId} className={`grid gap-4 px-5 py-4 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center ${isSuspicious(session) ? 'bg-amber-50' : ''}`}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{deviceName(session.userAgent)}</p>
                      {isSuspicious(session) ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                          Review
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 break-all text-xs text-slate-500">{session.userAgent || 'No user agent captured'}</p>
                    {session.geo?.city || session.geo?.country ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {[session.geo.city, session.geo.region, session.geo.country].filter(Boolean).join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">IP</p>
                    <p className="mt-1 text-sm text-slate-800">{session.ip || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Last active</p>
                    <p className="mt-1 text-sm text-slate-800">{formatDate(session.lastUsedAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(session.refreshTokenId)}
                    disabled={revokingSessionId === session.refreshTokenId}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {revokingSessionId === session.refreshTokenId ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
