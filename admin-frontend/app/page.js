'use client';

import Link from 'next/link';

const trustPoints = [
  {
    title: 'Fast, accurate estimates',
    description:
      'Get a clear preliminary quotation quickly with an AI-assisted workflow built for industrial PEB projects.',
  },
  {
    title: 'Built for real industrial use',
    description:
      'Designed for warehouses, factories, sheds, and large-scale structures where speed and clarity matter.',
  },
  {
    title: 'Conversion-focused support',
    description:
      'Move from enquiry to quotation to follow-up with a simple flow that keeps decision-makers engaged.',
  },
];

const industries = ['Cement', 'Power', 'Mining', 'Manufacturing'];

const industrialHighlights = [
  {
    title: 'Steel structure planning',
    description:
      'Estimate shed requirements, steel usage, and budget expectations before site inspection.',
  },
  {
    title: 'Warehouse and factory ready',
    description:
      'A clean experience for procurement teams, project managers, and industrial owners.',
  },
  {
    title: 'Quotation-first journey',
    description:
      'Guides users toward the estimate form with a strong CTA hierarchy and minimal friction.',
  },
];

export default function HomePage() {
  return (
    <main className="bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.12),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,1))]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200">
                Industrial PEB estimation made simple
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Get Industrial-Grade PEB Shed Quotation in 30 Seconds
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                AI-powered estimation for warehouses, factories, and industrial structures
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/estimate"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Get Instant Estimate
                </Link>
                <a
                  href="#why-choose-us"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-base font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Why Choose Us
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {trustPoints.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm"
                  >
                    <div className="mb-3 h-10 w-10 rounded-xl bg-blue-500/15 ring-1 ring-inset ring-blue-500/25" />
                    <h2 className="text-base font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-blue-500/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/30">
                <div className="grid gap-4 p-6 sm:p-8">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
                      Industrial overview
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Project type</p>
                        <p className="mt-2 text-lg font-semibold text-white">PEB Shed</p>
                      </div>
                      <div className="rounded-2xl bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Estimate time</p>
                        <p className="mt-2 text-lg font-semibold text-white">30 Seconds</p>
                      </div>
                      <div className="rounded-2xl bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Target use</p>
                        <p className="mt-2 text-lg font-semibold text-white">Warehouse / Factory</p>
                      </div>
                      <div className="rounded-2xl bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Output</p>
                        <p className="mt-2 text-lg font-semibold text-white">Quotation Preview</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {industrialHighlights.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                      >
                        <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 ring-1 ring-inset ring-slate-700" />
                        <h3 className="text-base font-semibold text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why-choose-us" className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
              Why Choose Us
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Built for speed, confidence, and industrial-scale decisions
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {trustPoints.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/20">
                  <span className="text-xl font-semibold">✓</span>
                </div>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
                Industries
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Tailored for key industrial sectors
              </h2>
            </div>
            <Link
              href="/estimate"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800"
            >
              Start your estimate
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry) => (
              <div
                key={industry}
                className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/40 hover:bg-slate-900"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-lg font-semibold text-blue-200 ring-1 ring-inset ring-slate-700">
                  {industry.slice(0, 1)}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{industry}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Reliable quotation support for {industry.toLowerCase()} infrastructure and planning.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
                Visual industrial section
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Designed with a clean industrial look that builds trust
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
                If no image assets are available, this layout keeps the page premium with steel-toned
                cards, structured blocks, and strong CTA visibility.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
                <div className="h-40 rounded-2xl border border-slate-700 bg-[linear-gradient(135deg,rgba(51,65,85,0.75),rgba(15,23,42,0.95))] p-4">
                  <div className="h-full rounded-xl border border-dashed border-slate-600 bg-slate-950/40" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">Steel structure dashboard</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  A structured visual block that represents industrial precision and clarity.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="grid h-40 grid-cols-3 gap-3 rounded-2xl bg-slate-950 p-4">
                  <div className="rounded-xl bg-slate-800" />
                  <div className="rounded-xl bg-slate-700" />
                  <div className="rounded-xl bg-slate-800" />
                  <div className="col-span-3 rounded-xl border border-slate-700 bg-gradient-to-r from-blue-900/40 to-slate-800" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">Industrial planning blocks</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Neutral and modern visuals that fit a high-conversion engineering workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 px-6 py-10 text-center sm:px-10">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to get your PEB shed estimate?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Start with an instant quotation flow that helps your team move faster and qualify the
              project early.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/estimate"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
              >
                Get Instant Estimate
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}