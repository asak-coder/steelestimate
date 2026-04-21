"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../../../components/admin/AdminNav";
import { getAdminLeads } from "../../../lib/api";
import { hasValidSession, onAuthChange } from "../../../lib/auth";

const LEADS_PATH = "/admin/leads";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "Contacted" },
  { value: "COMPLETED", label: "Converted" },
  { value: "REJECTED", label: "Rejected" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "high", label: "High priority" },
  { value: "normal", label: "Normal" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "calculator", label: "Calculator" },
  { value: "ai", label: "AI" },
  { value: "AI_ESTIMATOR", label: "AI Estimator" },
  { value: "boq", label: "BOQ" },
  { value: "mobile", label: "Mobile" },
  { value: "admin", label: "Admin" },
  { value: "api", label: "API" },
];

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object") {
    return toNumber(value.amount ?? value.value ?? value.total ?? value.price ?? value.cost ?? value.estimatedCost ?? 0);
  }
  return 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatusLabel(status) {
  const value = String(status || "").toUpperCase();
  switch (value) {
    case "NEW":
      return "New";
    case "IN_PROGRESS":
      return "Contacted";
    case "COMPLETED":
      return "Converted";
    case "REJECTED":
      return "Rejected";
    default:
      return value || "Unknown";
  }
}

function getStatusStyles(status) {
  const value = String(status || "").toUpperCase();
  switch (value) {
    case "NEW":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
    case "IN_PROGRESS":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "COMPLETED":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "REJECTED":
      return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    default:
      return "border-slate-700 bg-slate-900 text-slate-200";
  }
}

function getPriorityStyles(priority) {
  const value = String(priority || "").toLowerCase();
  if (value === "high") {
    return "border-orange-400/30 bg-orange-400/10 text-orange-200";
  }
  return "border-slate-700 bg-slate-900 text-slate-200";
}

function getSourceLabel(source) {
  const value = String(source || "").toLowerCase();
  switch (value) {
    case "calculator":
      return "Calculator";
    case "ai":
      return "AI";
    case "ai_estimator":
    case "AI_ESTIMATOR":
      return "AI Estimator";
    case "boq":
      return "BOQ";
    case "mobile":
      return "Mobile";
    case "admin":
      return "Admin";
    case "api":
      return "API";
    default:
      return value || "—";
  }
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    source: "",
    search: "",
    page: 1,
    limit: 25,
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    if (!hasValidSession()) {
      router.replace(`${"/admin/login"}?next=${encodeURIComponent(LEADS_PATH)}`);
      return undefined;
    }

    setIsReady(true);
    const unsubscribe = onAuthChange(() => {
      if (!hasValidSession()) {
        router.replace(`${"/admin/login"}?next=${encodeURIComponent(LEADS_PATH)}`);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [router]);

  useEffect(() => {
    if (!isReady) return undefined;

    let cancelled = false;

    async function loadLeads() {
      setLoading(true);
      setError("");

      try {
        const response = await getAdminLeads(appliedFilters);
        const payload = response?.data ?? response ?? {};
        const list = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.leads)
          ? payload.leads
          : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload)
          ? payload
          : [];

        if (!cancelled) {
          setLeads(list);
          setSummary(payload.summary || response?.summary || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load leads.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLeads();

    return () => {
      cancelled = true;
    };
  }, [isReady, appliedFilters]);

  const normalizedLeads = useMemo(() => {
    return leads.map((lead, index) => ({
      id: lead?.id ?? lead?._id ?? lead?.leadId ?? `${lead?.name ?? "lead"}-${lead?.createdAt ?? index}`,
      name: lead?.clientName ?? lead?.name ?? lead?.contactName ?? "Unnamed lead",
      phone: lead?.phone ?? lead?.contactPhone ?? "—",
      email: lead?.email ?? "—",
      projectType: lead?.projectType ?? lead?.project ?? lead?.projectName ?? lead?.projectData?.projectType ?? "—",
      estimatedCost: lead?.estimatedCost ?? lead?.optimizedPrice ?? lead?.cost?.estimatedCost ?? lead?.cost ?? 0,
      status: lead?.status ?? "NEW",
      priority: lead?.priority ?? "normal",
      source: lead?.source ?? "calculator",
      createdAt: lead?.createdAt ?? null,
      score: lead?.score,
      tag: lead?.tag,
      whatsappLink: lead?.whatsappLink ?? "",
    }));
  }, [leads]);

  const totalEstimatedValue = useMemo(
    () => normalizedLeads.reduce((sum, lead) => sum + toNumber(lead.estimatedCost), 0),
    [normalizedLeads]
  );

  const priorityCount = useMemo(
    () => normalizedLeads.filter((lead) => String(lead.priority).toLowerCase() === "high").length,
    [normalizedLeads]
  );

  const statusTotals = useMemo(() => {
    const counts = { NEW: 0, IN_PROGRESS: 0, COMPLETED: 0, REJECTED: 0 };
    normalizedLeads.forEach((lead) => {
      const key = String(lead.status || "NEW").toUpperCase();
      if (counts[key] !== undefined) {
        counts[key] += 1;
      }
    });
    return counts;
  }, [normalizedLeads]);

  const sourceTotals = useMemo(() => {
    return normalizedLeads.reduce(
      (acc, lead) => {
        const key = String(lead.source || "calculator").toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { calculator: 0, ai: 0, AI_ESTIMATOR: 0, boq: 0, mobile: 0, admin: 0, api: 0 }
    );
  }, [normalizedLeads]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: 1,
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    const next = {
      status: "",
      priority: "",
      source: "",
      search: "",
      page: 1,
      limit: 25,
    };
    setFilters(next);
    setAppliedFilters(next);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Checking admin session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Admin management</p>
          <div className="mt-2">
            <h1 className="text-3xl font-semibold text-slate-900">Leads</h1>
            <p className="mt-2 text-sm text-slate-600">
              Track incoming projects, priority leads, and status movement in one place.
            </p>
          </div>
        </div>

        <AdminNav />

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mb-4 grid gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-slate-500">Total leads</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? "—" : normalizedLeads.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-slate-500">Estimated pipeline value</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {loading ? "—" : formatCurrency(totalEstimatedValue)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-slate-500">High priority</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? "—" : priorityCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-slate-500">This page filters</p>
            <p className="mt-2 text-sm text-slate-600">status, priority, source, and search</p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all-status"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</span>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value || "all-priority"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Source</span>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange("source", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value || "all-source"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block xl:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Name, phone, project, email..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        {summary ? (
          <div className="mb-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Summary total leads</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalLeads ?? normalizedLeads.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Summary high priority</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.highPriorityLeads ?? priorityCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Summary estimated revenue</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(summary.totalEstimatedRevenue ?? totalEstimatedValue)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(statusTotals).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{getStatusLabel(key)}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : normalizedLeads.length > 0 ? (
                  normalizedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 align-top">
                        <div className="font-medium text-slate-900">{lead.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{lead.phone}</div>
                        <div className="mt-1 text-xs text-slate-400">{lead.email}</div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{lead.projectType}</td>
                      <td className="px-4 py-4 align-top text-sm font-medium text-slate-900">
                        {formatCurrency(lead.estimatedCost)}
                        <div className="mt-1 text-xs text-slate-400">
                          {typeof lead.score === "number" ? `Score ${lead.score}` : "No score"}
                          {lead.tag ? ` · ${lead.tag}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityStyles(lead.priority)}`}>
                          {String(lead.priority || "normal").toLowerCase() === "high" ? "High priority" : "Normal"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{getSourceLabel(lead.source)}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        <div>{formatDate(lead.createdAt)}</div>
                        {lead.whatsappLink ? (
                          <a
                            href={lead.whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                          >
                            Open WhatsApp
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      No leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
