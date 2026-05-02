'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname || '/admin')}`);
    }
  }, [authenticated, loading, pathname, router]);

  if (loading || !authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-300">
          Checking session...
        </div>
      </main>
    );
  }

  return children;
}

export default AuthGuard;
