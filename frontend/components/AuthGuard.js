'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasValidSession, onAuthChange } from '../lib/auth';

function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const guard = () => {
      if (!hasValidSession()) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname || '/admin')}`);
        setReady(false);
        return;
      }

      setReady(true);
    };

    guard();

    const unsubscribe = onAuthChange(() => {
      guard();
    });

    return unsubscribe;
  }, [pathname, router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-300">
          Verifying session...
        </div>
      </main>
    );
  }

  return children;
}

export default AuthGuard;