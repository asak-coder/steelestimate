'use client';

import { useState } from 'react';
import AdminNav from '../../../../components/admin/AdminNav';
import { disable2FA, enable2FA, setup2FA } from '../../../../lib/api';
import { useAuth } from '../../../../components/AuthProvider';

export default function AdminTwoFactorPage() {
  const { user, reloadUser } = useAuth();
  const [setup, setSetup] = useState(null);
  const [otp, setOtp] = useState('');
  const [disableOtp, setDisableOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function startSetup() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      setSetup(await setup2FA());
    } catch (err) {
      setError(err?.message || 'Unable to start 2FA setup.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await enable2FA({ otp });
      await reloadUser();
      setSetup(null);
      setOtp('');
      setMessage('Two-factor authentication is enabled.');
    } catch (err) {
      setError(err?.message || 'Unable to verify authenticator code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await disable2FA({ otp: disableOtp, password });
      await reloadUser();
      setDisableOtp('');
      setPassword('');
      setMessage('Two-factor authentication is disabled.');
    } catch (err) {
      setError(err?.message || 'Unable to disable 2FA.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Account hardening</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Two-factor authentication</h1>
        </div>

        <AdminNav />

        {message ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Authenticator app</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Use a TOTP authenticator app for admin access. Store recovery instructions in your organization password vault before enabling.
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Status: {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            {!user?.twoFactorEnabled ? (
              <button
                onClick={startSetup}
                disabled={loading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Enable 2FA
              </button>
            ) : null}
          </div>

          {setup ? (
            <form onSubmit={confirmSetup} className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <img src={setup.qrCodeDataUrl} alt="2FA QR code" className="h-48 w-48" />
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  Scan the QR code, then enter the 6-digit code from your authenticator app.
                </p>
                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Authenticator code</span>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </label>
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Recovery warning: if you lose the authenticator device, account recovery will require administrator intervention.
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Confirm activation
                </button>
              </div>
            </form>
          ) : null}
        </section>

        {user?.twoFactorEnabled ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Disable 2FA</h2>
            <form onSubmit={handleDisable} className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Authenticator code</span>
                <input
                  value={disableOtp}
                  onChange={(event) => setDisableOtp(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  Disable 2FA
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}
