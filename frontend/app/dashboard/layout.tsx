import Link from 'next/link';
import AuthGuard from '../../components/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Dashboard
              </p>
              <h1 className="text-lg font-semibold text-slate-900">BOQ Workspace</h1>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <Link
                href="/dashboard/boq"
                className="rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-white transition hover:bg-slate-800"
              >
                BOQ Builder
              </Link>
              <Link
                href="/dashboard/projects"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-100"
              >
                Saved Projects
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </AuthGuard>
  );
}