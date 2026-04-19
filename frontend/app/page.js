import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200">
              SteelEstimate Admin
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Secure admin dashboard for lead management and production operations
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Access the protected admin area at <span className="font-semibold text-white">/admin/login</span> to sign in and manage leads, review quotations, and monitor live pipeline activity.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Open Admin Login
              </Link>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                View Dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">Secure authentication</h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
              <p>
                The admin area now uses JWT-based authentication with route protection and role-based access control.
              </p>
              <p>
                Admin users can manage lead status, notes, and dashboard analytics after logging in through the secure login page.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
              Production access now requires valid credentials and an active session token.
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Public tool</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Steel weight calculator</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Quickly estimate steel weight from common shapes and dimensions using deterministic formulas.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/tools/weight-calculator"
                  className="inline-flex items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-400 hover:bg-blue-500/20"
                >
                  Open Weight Calculator
                </Link>
                <Link
                  href="/tools/ms-weight"
                  className="inline-flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  Open MS Weight Calculator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}