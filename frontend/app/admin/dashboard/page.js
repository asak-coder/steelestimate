"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatCard from "../../../components/StatCard";
import LeadTable from "../../../components/LeadTable";
import { getAdminStats, getLeads, updateLeadNotes, updateLeadStatus } from "../../../lib/api";
import { formatCurrency } from "../../../lib/format";
import { hasValidSession, onAuthChange } from "../../../lib/auth";

function normalizeLeads(list) {
  return Array.isArray(list) ? list : [];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalEstimatedRevenue: 0,
    conversionRate: 0,
    conversionCount: 0,
    statusCounts: {
      NEW: 0,
      HOT: 0,
      WARM: 0,
      COLD: 0
    }
  });
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState({ status: "all", from: "", to: "", score: "", search: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [ready, setReady] = useState(false);

  const filteredStats = useMemo(() => stats, [stats]);

  useEffect(() => {
    if (!hasValidSession()) {
      return;
    }

    const guard = () => {
      if (!hasValidSession()) {
        window.location.replace("/admin/login?next=/admin/dashboard");
        return;
      }

      setReady(true);
    };

    guard();

    const unsubscribe = onAuthChange(() => {
      guard();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!ready) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [statsResponse, leadsResponse] = await Promise.all([getAdminStats(), getLeads(filters)]);
        const statsData = statsResponse?.data || statsResponse || {};
        const leadsData = leadsResponse?.data || leadsResponse?.leads || leadsResponse || [];

        setStats({
          totalLeads: statsData.totalLeads ?? 0,
          totalEstimatedRevenue: statsData.totalEstimatedRevenue ?? 0,
          conversionRate: statsData.conversionRate ?? 0,
          conversionCount: statsData.conversionCount ?? 0,
          statusCounts: statsData.statusCounts || {
            NEW: 0,
            HOT: 0,
            WARM: 0,
            COLD: 0
          }
        });
        setLeads(normalizeLeads(leadsData));
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          window.location.replace("/admin/login?next=/admin/dashboard");
          return;
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filters, ready]);

  async function handleQuickStatusUpdate(lead, status) {
    try {
      await updateLeadStatus(lead._id, { status });
      setLeads((current) => current.map((item) => (item._id === lead._id ? { ...item, status } : item)));
      if (selectedLead?._id === lead._id) {
        setSelectedLead((current) => (current ? { ...current, status } : current));
      }
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        window.location.replace("/admin/login?next=/admin/dashboard");
        return;
      }
      setError(err.message);
    }
  }

  async function handleSaveNotes() {
    if (!selectedLead?._id) return;
    try {
      await updateLeadNotes(selectedLead._id, noteDraft);
      setSelectedLead((current) => (current ? { ...current, notes: noteDraft } : current));
      setLeads((current) => current.map((item) => (item._id === selectedLead._id ? { ...item, notes: noteDraft } : item)));
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        window.location.replace("/admin/login?next=/admin/dashboard");
        return;
      }
      setError(err.message);
    }
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-300">
          Verifying session...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Operations overview</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Monitor lead volume, estimated revenue and active pipeline performance.</p>
          </div>
          <Link className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2 text-sm text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10" href="/admin/leads">
            View all leads
          </Link>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Error: {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Leads" value={filteredStats.totalLeads} />
          <StatCard title="Revenue" value={formatCurrency(filteredStats.totalEstimatedRevenue)} />
          <StatCard title="Conversion %" value={`${Number(filteredStats.conversionRate).toFixed(1)}%`} />
          <StatCard title="Hot / Warm / Cold" value={`${filteredStats.statusCounts.HOT || 0} / ${filteredStats.statusCounts.WARM || 0} / ${filteredStats.statusCounts.COLD || 0}`} />
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-5 shadow-glow">
          <form className="grid gap-4 md:grid-cols-5" onSubmit={(event) => event.preventDefault()}>
            <label className="flex flex-col gap-2 text-sm text-white">
              Search
              <input className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Name, phone, email" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white">
              Status
              <select className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white">
              From
              <input className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white">
              To
              <input className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white">
              Score
              <input className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" type="number" min="0" max="100" value={filters.score} onChange={(event) => setFilters((current) => ({ ...current, score: event.target.value }))} />
            </label>
          </form>
        </section>

        <LeadTable
          leads={leads}
          onStatusChange={(lead) => {
            setSelectedLead(lead);
            setNoteDraft(lead.notes || "");
          }}
          emptyMessage={loading ? "Loading leads..." : "No leads match the selected filters."}
        />

        {selectedLead ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[rgba(17,24,39,0.88)] p-5 shadow-glow">
            <h2 className="text-lg font-semibold text-white">Lead actions</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{selectedLead.clientName || selectedLead.projectData?.projectName || selectedLead._id}</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <button className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-emerald-400/10" onClick={() => handleQuickStatusUpdate(selectedLead, "HOT")} type="button">Mark Hot</button>
              <button className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-amber-400/10" onClick={() => handleQuickStatusUpdate(selectedLead, "WARM")} type="button">Mark Warm</button>
              <button className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-sky-400/10" onClick={() => handleQuickStatusUpdate(selectedLead, "COLD")} type="button">Mark Cold</button>
              <button className="rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-cyan-400/10" onClick={() => handleQuickStatusUpdate(selectedLead, "WON")} type="button">Mark Won</button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-white">Notes</label>
                <textarea className="mt-2 min-h-32 w-full rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.8)] px-4 py-3 text-white outline-none" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                <button className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={handleSaveNotes} type="button">Save notes</button>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[rgba(15,23,42,0.65)] p-4 text-sm text-white">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Project data</div>
                <pre className="overflow-auto text-xs leading-6 text-cyan-100">{JSON.stringify(selectedLead.projectData || {}, null, 2)}</pre>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
