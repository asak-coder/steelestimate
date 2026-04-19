"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { estimateWithAi, request } from "@/lib/api";
import { hasValidSession } from "@/lib/auth";

type ProjectType = "warehouse" | "industrial";
type AccessStatus = "guest" | "free" | "paid";

type AiEstimateResponse = {
  input?: {
    projectType?: string;
    area?: number;
    height?: number;
    location?: string;
  };
  ruleBasedResult?: RangeBundle;
  aiAdjustedSuggestion?: AiSuggestion;
  explanation?: string;
  meta?: {
    engineVersion?: string;
    model?: string;
    usedAi?: boolean;
  };
};

type RangeValue = {
  min: number;
  max: number;
  unit: string;
};

type RangeBundle = {
  steelPerSqft: RangeValue;
  totalSteelKg: RangeValue;
  costPerKg: RangeValue;
  costRangeInr: RangeValue;
};

type AiSuggestion = {
  optimizedRange: RangeBundle;
  explanation: string;
  usedAi?: boolean;
};

type FormState = {
  projectType: ProjectType;
  area: string;
  height: string;
  location: string;
};

const projectTypeOptions: { value: ProjectType; label: string; hint: string }[] = [
  { value: "warehouse", label: "Warehouse", hint: "4–6 kg/sqft" },
  { value: "industrial", label: "Industrial", hint: "6–8 kg/sqft" },
];

const initialForm: FormState = {
  projectType: "warehouse",
  area: "10000",
  height: "12",
  location: "Pune, India",
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value || 0);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatRange = (range?: RangeValue | null, digits = 2) => {
  if (!range) return "—";
  const min = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(range.min) ? 0 : digits,
  }).format(range.min || 0);
  const max = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(range.max) ? 0 : digits,
  }).format(range.max || 0);

  return `${min} to ${max} ${range.unit}`;
};

export default function AiEstimatorPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<AiEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("guest");

  useEffect(() => {
    let cancelled = false;

    async function detectAccess() {
      if (!hasValidSession()) {
        if (!cancelled) setAccessStatus("guest");
        return;
      }

      try {
        const profileResponse = await request("/api/auth/me", {
          method: "GET",
          redirectOnAuthError: false,
        });

        const profile = profileResponse?.user || profileResponse?.data || profileResponse?.result || profileResponse;
        const planType = String(profile?.planType || profile?.plan || profile?.subscription?.plan || "free").toLowerCase();

        if (!cancelled) {
          setAccessStatus(planType && planType !== "free" ? "paid" : "free");
        }
      } catch (_) {
        if (!cancelled) setAccessStatus("guest");
      }
    }

    detectAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated = accessStatus !== "guest";
  const submitHref = accessStatus === "guest" ? "/admin/login?redirect=/tools/ai-estimator" : "/admin/dashboard";

  const ruleBased = result?.ruleBasedResult;
  const aiSuggestion = result?.aiAdjustedSuggestion;

  const canSubmit = useMemo(() => {
    const area = Number(form.area);
    const height = Number(form.height);
    return Boolean(form.projectType) && Number.isFinite(area) && area > 0 && Number.isFinite(height) && height >= 0;
  }, [form.area, form.height, form.projectType]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isAuthenticated) {
      setError("Sign in to run the AI estimator. Free accounts get limited usage; paid accounts get full access.");
      return;
    }

    if (!canSubmit) {
      setError("Please enter a valid area and height before generating the estimate.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        projectType: form.projectType,
        area: Number(form.area),
        height: Number(form.height),
        location: form.location.trim(),
      };

      const response = (await estimateWithAi(payload)) as AiEstimateResponse & { data?: AiEstimateResponse };
      const output = response?.data || response;

      setResult(output || null);
    } catch (submitError: unknown) {
      const apiError = submitError as {
        status?: number;
        data?: {
          message?: string;
        };
      };

      const status = apiError?.status;
      if (status === 401) {
        setError("Your session has expired. Please sign in again to continue.");
      } else if (status === 429) {
        setError(
          apiError?.data?.message ||
            "You have reached the daily AI estimate limit for your free plan. Upgrade for full access."
        );
      } else if (status === 403) {
        setError(apiError?.data?.message || "This feature is available on paid plans only.");
      } else {
        setError(submitError instanceof Error ? submitError.message : "Unable to generate AI estimate at the moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  const explanation = aiSuggestion?.explanation || result?.explanation || "Run the estimator to see the AI explanation.";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/30">
          <div className="border-b border-slate-800 px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">AI estimation tool</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                AI-assisted EPC estimation engine
              </h1>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100">
                Free: limited AI usage
              </span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                Paid: full access
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              Estimate steel consumption and project cost for EPC structures using a hybrid rule-based and AI-adjusted
              workflow designed for India.
            </p>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6">
              {error ? (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Project Type
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {projectTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, projectType: option.value }))}
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          form.projectType === option.value
                            ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
                            : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                        }`}
                      >
                        <div className="text-sm font-semibold">{option.label}</div>
                        <div className="text-xs text-slate-400">{option.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Area (sqft)"
                    type="number"
                    value={form.area}
                    onChange={(value) => setForm((current) => ({ ...current, area: value }))}
                    step="1"
                  />
                  <Field
                    label="Height (m)"
                    type="number"
                    value={form.height}
                    onChange={(value) => setForm((current) => ({ ...current, height: value }))}
                    step="0.1"
                  />
                </div>

                <Field
                  label="Location"
                  type="text"
                  value={form.location}
                  onChange={(value) => setForm((current) => ({ ...current, location: value }))}
                />

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-sm font-semibold text-slate-100">Feature gating</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {accessStatus === "guest"
                      ? "Sign in to use the AI estimator. Free accounts get limited daily usage, while paid accounts get full access."
                      : accessStatus === "paid"
                        ? "You are on a paid plan with full AI access."
                        : "You are on a free plan. AI usage is limited by daily quota."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={submitHref}
                      className="inline-flex items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-400 hover:bg-blue-500/20"
                    >
                      {accessStatus === "guest" ? "Sign in to continue" : "Open account dashboard"}
                    </Link>
                    <span className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
                      {accessStatus === "paid" ? "Full access enabled" : "Limited AI usage on free plan"}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Generating estimate..." : "Generate AI estimate"}
                </button>
              </form>
            </section>

            <aside className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Estimate output</p>

              <div className="mt-4 space-y-4">
                <ResultCard
                  label="Rule-based steel range"
                  value={formatRange(ruleBased?.steelPerSqft)}
                  note="Warehouse: 4–6 kg/sqft · Industrial: 6–8 kg/sqft"
                />
                <ResultCard
                  label="Rule-based steel total"
                  value={formatRange(ruleBased?.totalSteelKg)}
                  note="Computed as area × steel consumption"
                />
                <ResultCard
                  label="Rule-based cost range"
                  value={formatRange(ruleBased?.costRangeInr)}
                  note="Using ₹70–₹90 per kg"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  AI-adjusted suggestion
                </p>
                <div className="mt-3 space-y-3">
                  <ResultLine label="Optimized steel range" value={formatRange(aiSuggestion?.optimizedRange?.steelPerSqft)} />
                  <ResultLine label="Optimized total steel" value={formatRange(aiSuggestion?.optimizedRange?.totalSteelKg)} />
                  <ResultLine label="Optimized cost range" value={formatRange(aiSuggestion?.optimizedRange?.costRangeInr)} />
                  <ResultLine label="AI status" value={result?.meta?.usedAi ? "AI model used" : "Fallback optimization used"} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">AI explanation</p>
                <p className="mt-3 text-sm leading-6 text-slate-100">{explanation}</p>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                <p className="text-sm font-semibold text-white">Get detailed BOQ + quotation</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Convert this estimate into a detailed bill of quantities and a formal quotation for EPC execution.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={accessStatus === "guest" ? "/admin/login?redirect=/tools/ai-estimator" : "/admin/dashboard"}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Get detailed BOQ + quotation
                  </Link>
                  <Link
                    href="/tools/ms-weight"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                  >
                    Try MS weight calculator
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
      />
    </div>
  );
}

function ResultCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{note}</p>
    </div>
  );
}

function ResultLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
