'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get('next') || '/admin/dashboard', [searchParams]);
  const { authenticated, loading: authLoading, login, verify2FA } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && authenticated) {
      router.replace(nextPath);
    }
  }, [authenticated, authLoading, nextPath, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login({ email, password });
      const payload = response?.data || response || {};

      if (payload.requires2FA) {
        setTwoFactorToken(payload.twoFactorToken);
        setPassword('');
        return;
      }

      router.replace(nextPath);
    } catch (err) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function handle2FASubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verify2FA({ twoFactorToken, otp });
      router.replace(nextPath);
    } catch (err) {
      setError(err.message || 'Unable to verify two-factor code');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-300">
          Checking session...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
        <div className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200">
          SteelEstimate Admin
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">Sign in to continue</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Use your admin credentials to access the dashboard and lead management tools.
        </p>

        <form className="mt-8 space-y-4" onSubmit={twoFactorToken ? handle2FASubmit : handleSubmit}>
          {!twoFactorToken ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-200">Email</span>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-blue-500"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-200">Password</span>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-blue-500"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
            </>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Authenticator code</span>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-blue-500"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                required
                autoComplete="one-time-code"
              />
            </label>
          )}

          {error ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : twoFactorToken ? 'Verify code' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
