export default function ApiDocsPage() {
  const requestBody = `{
  "length": 50,
  "width": 20,
  "height": 8
}`;

  const responseBody = `{
  "success": true,
  "message": "PEB estimation generated successfully",
  "data": {
    "area": 1000,
    "steelWeight": 22.4,
    "estimatedCost": 2850000,
    "currency": "INR"
  }
}`;

  const jsExample = `const response = await fetch('/api/public/peb-calc', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_KEY'
  },
  body: JSON.stringify({
    length: 50,
    width: 20,
    height: 8
  })
});

const data = await response.json();
console.log(data);`;

  const curlExample = `curl -X POST https://your-domain.com/api/public/peb-calc \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"length":50,"width":20,"height":8}'`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(10,15,26,1))] text-[var(--foreground)]">
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8 md:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.28em] text-cyan-200">
              API documentation
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              PEB Estimation API
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Developer-friendly reference for generating PEB estimates through the public calculation endpoint.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <article className="rounded-3xl border border-[var(--border)] bg-[rgba(17,24,39,0.92)] p-6 shadow-glow">
            <h2 className="text-lg font-semibold text-white">Endpoint</h2>
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 font-mono text-sm text-cyan-200">
              POST /api/public/peb-calc
            </div>
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[rgba(17,24,39,0.92)] p-6 shadow-glow">
            <h2 className="text-lg font-semibold text-white">Headers</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <tbody>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <td className="px-4 py-3 font-mono text-cyan-200">x-api-key</td>
                    <td className="px-4 py-3 text-[var(--muted)]">YOUR_KEY</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[rgba(17,24,39,0.92)] p-6 shadow-glow">
            <h2 className="text-lg font-semibold text-white">Request payload</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Example request body</p>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-200">{requestBody}</pre>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-3xl border border-[var(--border)] bg-[rgba(17,24,39,0.92)] p-6 shadow-glow">
            <h2 className="text-lg font-semibold text-white">Example response</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Typical successful response structure</p>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-200">{responseBody}</pre>
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[rgba(17,24,39,0.92)] p-6 shadow-glow">
            <h2 className="text-lg font-semibold text-white">Code examples</h2>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">JavaScript fetch</h3>
                <pre className="mt-3 overflow-x-auto text-sm leading-6 text-slate-200">{jsExample}</pre>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">curl</h3>
                <pre className="mt-3 overflow-x-auto text-sm leading-6 text-slate-200">{curlExample}</pre>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
