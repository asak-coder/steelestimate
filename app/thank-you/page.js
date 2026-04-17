export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Request received successfully
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Thank you for your enquiry
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Our team will contact you shortly with the next steps for your PEB quotation.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
                Instant quotation
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                No waiting, no follow-up delays — we review industrial requirements quickly.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
                Industrial support
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Built for sheds, warehouses, and fabrication projects across sectors.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://wa.me/"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              WhatsApp Us
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/60 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-300"
            >
              Back to Home
            </a>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            If you need urgent assistance, reach out on WhatsApp for a faster response.
          </p>
        </div>
      </section>
    </main>
  );
}