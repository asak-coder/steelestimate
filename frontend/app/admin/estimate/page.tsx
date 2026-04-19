"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type ProjectType = "industrial" | "peb";

type EstimateFormState = {
  projectType: ProjectType;
  tonnage: string;
  height: string;
  hazard: boolean;
};

type EstimateApiCostValue = number | string | null | undefined | Record<string, number | string | null | undefined>;

type EstimateApiData = {
  engineering?: unknown;
  cost?: EstimateApiCostValue;
  loss?: EstimateApiCostValue;
  finalAmount?: EstimateApiCostValue;
};

type EstimateApiResponse = {
  success?: boolean;
  message?: string;
  data?: EstimateApiData;
};

type EstimateResultValues = {
  engineering: unknown;
  fabricationCost: number | null;
  erectionCost: number | null;
  totalCost: number | null;
  lossAdjustedCost: number | null;
  finalAmount: number | null;
};

type FieldErrors = Partial<Record<"projectType" | "tonnage" | "height" | "submit", string>>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

function parseNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickCostValue(value: EstimateApiCostValue, keys: string[]): number | null {
  const direct = parseNumericValue(value);
  if (direct !== null) return direct;

  if (value && typeof value === "object") {
    for (const key of keys) {
      const nestedValue = parseNumericValue((value as Record<string, unknown>)[key]);
      if (nestedValue !== null) return nestedValue;
    }
  }

  return null;
}

function formatCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCostBreakdown(data?: EstimateApiData): EstimateResultValues {
  const cost = data?.cost;
  const loss = data?.loss;
  const finalAmount = parseNumericValue(data?.finalAmount);

  const fabricationCost = pickCostValue(cost, ["fabrication", "fabricationCost", "fab", "fabrication_cost"]);
  const erectionCost = pickCostValue(cost, ["erection", "erectionCost", "erection_cost"]);
  const totalCost = pickCostValue(cost, ["total", "totalCost", "gross", "base"]);
  const lossAdjustedCost = pickCostValue(loss, ["lossAdjusted", "lossAdjustedCost", "adjusted", "afterLoss"]);
  const resolvedFinalAmount = finalAmount ?? lossAdjustedCost ?? totalCost;

  return {
    engineering: data?.engineering,
    fabricationCost,
    erectionCost,
    totalCost,
    lossAdjustedCost,
    finalAmount: resolvedFinalAmount,
  };
}

function validateForm(values: EstimateFormState): FieldErrors {
  const errors: FieldErrors = {};

  if (values.projectType !== "industrial" && values.projectType !== "peb") {
    errors.projectType = "Select a project type.";
  }

  const tonnage = Number(values.tonnage);
  if (!values.tonnage.trim()) {
    errors.tonnage = "Enter tonnage.";
  } else if (!Number.isFinite(tonnage) || tonnage <= 0) {
    errors.tonnage = "Tonnage must be greater than 0.";
  }

  const height = Number(values.height);
  if (!values.height.trim()) {
    errors.height = "Enter height.";
  } else if (!Number.isFinite(height) || height <= 0) {
    errors.height = "Height must be greater than 0.";
  }

  return errors;
}

function EstimateForm({
  values,
  onChange,
  onSubmit,
  loading,
  errors,
}: {
  values: EstimateFormState;
  onChange: (next: EstimateFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  errors: FieldErrors;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">Estimate</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Run steel project pricing</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Provide the core project inputs to generate fabrication, erection, loss adjusted, and final pricing.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
          Project type
          <select
            value={values.projectType}
            onChange={(event) => onChange({ ...values, projectType: event.target.value as ProjectType })}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
          >
            <option value="industrial">industrial</option>
            <option value="peb">peb</option>
          </select>
          {errors.projectType ? <span className="text-xs text-red-300">{errors.projectType}</span> : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
          Tonnage
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.tonnage}
            onChange={(event) => onChange({ ...values, tonnage: event.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            placeholder="e.g. 125"
          />
          {errors.tonnage ? <span className="text-xs text-red-300">{errors.tonnage}</span> : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
          Height
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.height}
            onChange={(event) => onChange({ ...values, height: event.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            placeholder="e.g. 18"
          />
          {errors.height ? <span className="text-xs text-red-300">{errors.height}</span> : null}
        </label>

        <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-medium text-slate-200">
          <span>
            Hazardous site
            <span className="mt-1 block text-xs font-normal text-slate-400">Toggle if the project has hazard requirements.</span>
          </span>
          <button
            type="button"
            onClick={() => onChange({ ...values, hazard: !values.hazard })}
            className={`relative inline-flex h-10 w-16 items-center rounded-full border border-white/10 px-1 transition ${
              values.hazard ? "bg-cyan-400/30" : "bg-slate-800"
            }`}
            aria-pressed={values.hazard}
            aria-label="Toggle hazardous site"
          >
            <span
              className={`inline-block h-8 w-8 rounded-full bg-white shadow-lg transition ${
                values.hazard ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      {errors.submit ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errors.submit}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Running estimate..." : "Generate estimate"}
        </button>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          Back to dashboard
        </Link>
      </div>
    </form>
  );
}

function EstimateResult({
  result,
}: {
  result: EstimateResultValues;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">Result</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Pricing breakdown</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-400">Fabrication cost</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(result.fabricationCost)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-400">Erection cost</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(result.erectionCost)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-400">Total cost</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(result.totalCost)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-400">Loss adjusted cost</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(result.lossAdjustedCost)}</p>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <p className="text-sm text-cyan-200">Final amount</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(result.finalAmount)}</p>
        </div>
      </div>
    </section>
  );
}

export default function AdminEstimatePage() {
  const [values, setValues] = useState<EstimateFormState>({
    projectType: "industrial",
    tonnage: "",
    height: "",
    hazard: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<EstimateResultValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const hasResult = useMemo(() => Boolean(result), [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateForm(values);
    setFieldErrors(errors);
    setError("");

    if (Object.keys(errors).length > 0) {
      setResult(null);
      return;
    }

    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_URL is required.");
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/orchestrator/run`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          projectType: values.projectType,
          tonnage: Number(values.tonnage),
          height: Number(values.height),
          hazard: values.hazard,
        }),
      });

      const data: EstimateApiResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to run estimate");
      }

      if (!data.success) {
        throw new Error(data.message || "Estimate request failed");
      }

      const nextResult = getCostBreakdown(data.data);
      setResult(nextResult);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Failed to run estimate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <EstimateForm
          values={values}
          onChange={(next) => setValues(next)}
          onSubmit={handleSubmit}
          loading={loading}
          errors={fieldErrors}
        />

        {error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {hasResult && result ? <EstimateResult result={result} /> : null}
      </div>
    </main>
  );
}
