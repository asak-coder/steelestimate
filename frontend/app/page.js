import Link from 'next/link';

const ADMIN_EMAIL = 'admin@steelestimate.com';
const ADMIN_PASSWORD = 'ChangeMeNow!23';

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
              Access the protected admin area at <span className="font-semibold text-white">/admin</span> to review leads, update status, and monitor live quotation activity.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Open Admin Dashboard
              </Link>
              <a
                href="mailto:admin@steelestimate.com"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Contact Admin
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">Admin login details</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Email</p>
                <p className="mt-1 font-mono text-sm text-white">{ADMIN_EMAIL}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Password</p>
                <p className="mt-1 font-mono text-sm text-white">{ADMIN_PASSWORD}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
              This placeholder login must be replaced with a secure server-side JWT admin auth flow before production deployment.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
