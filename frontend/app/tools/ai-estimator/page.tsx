"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createLead, estimateWithAi } from "@/lib/api";
import { buildBoqSavePayload } from "@/lib/boq";

type ProjectType = "warehouse" | "shed" | "industrial";

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

type LeadFormState = {
  name: string;
  phone: string;
  email: string;
  projectDetails: string;
};

type BoqRow = {
  section: string;
  quantity: number;
  unit: string;
  weightKg: number;
  costInr: number;
};

const projectTypeOptions: { value: ProjectType; label: string; hint: string }[] = [
  { value: "warehouse", label: "Warehouse", hint: "4–6 kg/sqft" },
  { value: "shed", label: "Shed", hint: "3.5–5 kg/sqft" },
  { value: "industrial", label: "Industrial", hint: "6–8 kg/sqft" },
];

const initialForm: FormState = {
  projectType: "warehouse",
  area: "10000",
  height: "12",
  location: "Pune, India",
};

const initialLeadForm: LeadFormState = {
  name: "",
  phone: "",
  email: "",
  projectDetails: "",
};

const STEEL_RATE_PER_KG = 150;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(digits, 2),
  }).format(Number.isFinite(value) ? value : 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatRange(value: RangeValue | undefined | null) {
  if (!value) return "—";
  const unit = value.unit ? ` ${value.unit}` : "";
  return `${formatNumber(value.min)} to ${formatNumber(value.max)}${unit}`;
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

function normalizePhoneForWhatsApp(value: string) {
  return normalizePhone(value).replace(/^\+/, "");
}

function getProjectProfile(projectType: ProjectType) {
  switch (projectType) {
    case "industrial":
      return { min: 6, max: 8, label: "Industrial" };
    case "shed":
      return { min: 3.5, max: 5, label: "Shed" };
    case "warehouse":
    default:
      return { min: 4, max: 6, label: "Warehouse" };
  }
}

function buildRuleBasedEstimate(area: number, projectType: ProjectType) {
  const profile = getProjectProfile(projectType);
  const minSteelKg = area * profile.min;
  const maxSteelKg = area * profile.max;

  return {
    projectType: profile.label,
    steelPerSqft: {
      min: profile.min,
      max: profile.max,
      unit: "kg/sqft",
    },
    totalSteelKg: {
      min: minSteelKg,
      max: maxSteelKg,
      unit: "kg",
    },
    totalSteelMt: {
      min: minSteelKg / 1000,
      max: maxSteelKg / 1000,
      unit: "MT",
    },
    costPerKg: {
      min: STEEL_RATE_PER_KG,
      max: STEEL_RATE_PER_KG,
      unit: "₹/kg",
    },
    costRangeInr: {
      min: minSteelKg * STEEL_RATE_PER_KG,
      max: maxSteelKg * STEEL_RATE_PER_KG,
      unit: "INR",
    },
  };
}

function deriveBreakdown(projectType: ProjectType, totalSteelKg: number, aiSuggestion?: AiSuggestion) {
  const suggestion = aiSuggestion?.optimizedRange;
  const primaryPercent = clamp(Math.round(suggestion ? suggestion.steelPerSqft.min * 8 : projectType === "industrial" ? 58 : 60), 50, 72);
  const secondaryPercent = clamp(Math.round(suggestion ? 100 - primaryPercent - 12 : projectType === "industrial" ? 20 : 18), 12, 34);
  const claddingPercent = Math.max(0, 100 - primaryPercent - secondaryPercent);

  const primaryKg = round(totalSteelKg * (primaryPercent / 100), 2);
  const secondaryKg = round(totalSteelKg * (secondaryPercent / 100), 2);
  const claddingKg = round(totalSteelKg * (claddingPercent / 100), 2);

  return {
    primaryPercent,
    secondaryPercent,
    claddingPercent,
    primaryKg,
    secondaryKg,
    claddingKg,
  };
}

function buildBoqRows(totalSteelKg: number, costInr: number, breakdown: ReturnType<typeof deriveBreakdown>): BoqRow[] {
  return [
    {
      section: "Primary structural steel",
      quantity: 1,
      unit: "lot",
      weightKg: breakdown.primaryKg,
      costInr: round(costInr * (breakdown.primaryKg / Math.max(totalSteelKg, 1)), 0),
    },
    {
      section: "Secondary members",
      quantity: 1,
      unit: "lot",
      weightKg: breakdown.secondaryKg,
      costInr: round(costInr * (breakdown.secondaryKg / Math.max(totalSteelKg, 1)), 0),
    },
    {
      section: "Roof and wall cladding",
      quantity: 1,
      unit: "lot",
      weightKg: breakdown.claddingKg,
      costInr: round(costInr * (breakdown.claddingKg / Math.max(totalSteelKg, 1)), 0),
    },
  ];
}

function buildWhatsAppMessage({
  projectType,
  area,
  height,
  location,
  steelKg,
  costMin,
  costMax,
  name,
  phone,
  email,
  projectDetails,
}: {
  projectType: ProjectType;
  area: number;
  height: number;
  location: string;
  steelKg: number;
  costMin: number;
  costMax: number;
  name: string;
  phone: string;
  email: string;
  projectDetails: string;
}) {
  return [
    "Hello, I would like a quote for my project.",
    "",
    `Project type: ${projectType}`,
    `Area: ${formatNumber(area, 0)} sqft`,
    `Height: ${formatNumber(height, 1)} ft`,
    `Location: ${location}`,
    `Estimated steel: ${formatNumber(steelKg, 0)} kg`,
    `Estimated cost: ${formatCurrency(costMin)} - ${formatCurrency(costMax)}`,
    name ? `Name: ${name}` : "",
    phone ? `Phone: ${phone}` : "",
    email ? `Email: ${email}` : "",
    projectDetails ? `Project details: ${projectDetails}` : "",
    "",
    "Please share the next steps and quotation details.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildWhatsAppUrl(message: string) {
  const configuredNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER ||
    "";

  const cleanNumber = normalizePhoneForWhatsApp(configuredNumber);
  const encodedMessage = encodeURIComponent(message);

  if (cleanNumber) {
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
}

export default function AiEstimatorPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [leadForm, setLeadForm] = useState<LeadFormState>(initialLeadForm);
  const [result, setResult] = useState<AiEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [error, setError] = useState("");
  const [leadError, setLeadError] = useState("");
  const [leadSuccess, setLeadSuccess] = useState("");

  const area = Number(form.area);
  const height = Number(form.height);
  const canSubmit = Number.isFinite(area) && area > 0 && Number.isFinite(height) && height > 0 && form.location.trim().length > 0;

  const ruleBased = useMemo(() => {
    if (!canSubmit) return null;
    return buildRuleBasedEstimate(area, form.projectType);
  }, [area, canSubmit, form.projectType]);

  const aiSuggestion = result?.aiAdjustedSuggestion;
  const aiExplanation =
    aiSuggestion?.explanation ||
    result?.explanation ||
    "Run the estimator to get an AI-generated optimization note for the project layout and steel distribution.";

  const totalSteelKg = ruleBased ? ruleBased.totalSteelKg.max : 0;
  const totalSteelMt = totalSteelKg / 1000;
  const totalCostMin = ruleBased?.costRangeInr.min || 0;
  const totalCostMax = ruleBased?.costRangeInr.max || 0;
  const estimatedLeadCost = ruleBased ? Math.round((totalCostMin + totalCostMax) / 2) : 0;

  const breakdown = useMemo(() => {
    if (!ruleBased) {
      return {
        primaryPercent: 0,
        secondaryPercent: 0,
        claddingPercent: 0,
        primaryKg: 0,
        secondaryKg: 0,
        claddingKg: 0,
      };
    }

    return deriveBreakdown(form.projectType, totalSteelKg, aiSuggestion || undefined);
  }, [aiSuggestion, form.projectType, ruleBased, totalSteelKg]);

  const boqRows = useMemo(() => {
    if (!ruleBased) return [];
    return buildBoqRows(totalSteelKg, totalCostMax, breakdown);
  }, [breakdown, ruleBased, totalCostMax, totalSteelKg]);

  const boqPayload = useMemo(() => {
    if (!ruleBased) return null;

    return buildBoqSavePayload(
      boqRows.map((row) => ({
        id: row.section,
        type: "IS",
        section: row.section,
        dimensions: {
          quantity: row.quantity,
          unit: row.unit,
          source: "ai-estimator",
        },
        quantity: row.quantity,
        weight: row.weightKg,
        cost: row.costInr,
      })),
      `AI Estimator - ${form.projectType}`,
    );
  }, [boqRows, form.projectType, ruleBased]);

  const whatsappMessage = useMemo(() => {
    if (!ruleBased) return "";

    return buildWhatsAppMessage({
      projectType: form.projectType,
      area,
      height,
      location: form.location.trim(),
      steelKg: totalSteelKg,
      costMin: totalCostMin,
      costMax: totalCostMax,
      name: leadForm.name.trim(),
      phone: leadForm.phone.trim(),
      email: leadForm.email.trim(),
      projectDetails: leadForm.projectDetails.trim(),
    });
  }, [area, form.location, form.projectType, height, leadForm.email, leadForm.name, leadForm.phone, leadForm.projectDetails, ruleBased, totalCostMax, totalCostMin, totalSteelKg]);

  const whatsappUrl = useMemo(() => {
    if (!whatsappMessage) return "";
    return buildWhatsAppUrl(whatsappMessage);
  }, [whatsappMessage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLeadSuccess("");

    if (!canSubmit) {
      setError("Enter a valid project type, area, height, and location.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        projectType: form.projectType,
        area,
        height,
        location: form.location.trim(),
      };

      const response = (await estimateWithAi(payload)) as AiEstimateResponse & { data?: AiEstimateResponse };
      setResult(response?.data || response || null);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Unable to generate estimate right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLeadError("");
    setLeadSuccess("");

    if (!result || !ruleBased) {
      setLeadError("Generate an estimate first.");
      return;
    }

    const name = leadForm.name.trim();
    const phone = normalizePhone(leadForm.phone);
    const email = leadForm.email.trim();
    const projectDetails = leadForm.projectDetails.trim();

    if (!name || !phone || !email || !projectDetails) {
      setLeadError("Please enter your name, phone, email, and project details.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLeadError("Please enter a valid email address.");
      return;
    }

    setLeadLoading(true);

    try {
      const response = await createLead({
        name,
        clientName: name,
        phone,
        email,
        message: projectDetails,
        projectType: form.projectType,
        area,
        steel: totalSteelKg,
        estimatedCost: estimatedLeadCost,
        source: "AI_ESTIMATOR",
        cost: {
          estimatedCost: estimatedLeadCost,
          minCost: totalCostMin,
          maxCost: totalCostMax,
          area,
          steel: totalSteelKg,
          projectType: form.projectType,
          location: form.location.trim(),
          source: "AI_ESTIMATOR",
        },
        projectData: {
          projectType: form.projectType,
          area,
          height,
          location: form.location.trim(),
          projectDetails,
        },
      });

      const savedLead = response?.data || response?.result || response || {};
      const savedWhatsapp = response?.automation?.whatsappLink || whatsappUrl;

      setLeadSuccess(
        savedLead?.id
          ? `Lead saved successfully${response?.automation?.emailSent ? " and confirmation email sent." : "."}`
          : "Lead saved successfully."
      );

      if (savedWhatsapp) {
        window.open(savedWhatsapp, "_blank", "noopener,noreferrer");
      }
    } catch (submitError: unknown) {
      setLeadError(submitError instanceof Error ? submitError.message : "Unable to save your lead right now.");
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/30">
          <div className="border-b border-slate-800 px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">AI estimator</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Steel project estimator
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              Turn minimal input into a near-complete project estimate with steel consumption, cost range, AI guidance,
              BOQ-ready output, and a lead capture flow that converts estimates into conversations.
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
                  <div className="grid gap-3 sm:grid-cols-3">
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
                    label="Height (ft)"
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

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <MetricCard label="Total steel" value={`${formatNumber(totalSteelMt, 3)} MT`} note="Rule engine output" />
                <MetricCard
                  label="Cost range"
                  value={`${formatCurrency(totalCostMin)} - ${formatCurrency(totalCostMax)}`}
                  note={`₹${STEEL_RATE_PER_KG}/kg total cost`}
                />
                <MetricCard
                  label="Primary structure"
                  value={`${breakdown.primaryPercent}%`}
                  note={`${formatNumber(breakdown.primaryKg, 0)} kg`}
                />
                <MetricCard
                  label="Secondary structure"
                  value={`${breakdown.secondaryPercent}%`}
                  note={`${formatNumber(breakdown.secondaryKg, 0)} kg`}
                />
                <MetricCard
                  label="Cladding"
                  value={`${breakdown.claddingPercent}%`}
                  note={`${formatNumber(breakdown.claddingKg, 0)} kg`}
                />
                <MetricCard
                  label="Height"
                  value={`${formatNumber(height, 1)} ft`}
                  note={form.location.trim()}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">AI explanation</p>
                <p className="mt-3 text-sm leading-6 text-slate-100">{aiExplanation}</p>
              </div>

              <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Get quote on WhatsApp</p>
                <p className="mt-3 text-sm leading-6 text-slate-100">
                  Pre-filled with the current estimate and any contact details you add below.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={whatsappUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!whatsappUrl}
                    className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      whatsappUrl
                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        : "cursor-not-allowed bg-slate-700 text-slate-400"
                    }`}
                  >
                    Get Quote on WhatsApp
                  </a>
                  <Link
                    href="/dashboard/boq"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                  >
                    Generate detailed BOQ
                  </Link>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                <p className="text-sm font-semibold text-white">Lead capture</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Save the lead, trigger the confirmation email, and route high-value estimates into the sales queue.
                </p>

                {leadError ? (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {leadError}
                  </div>
                ) : null}

                {leadSuccess ? (
                  <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {leadSuccess}
                  </div>
                ) : null}

                <form className="mt-4 space-y-4" onSubmit={handleLeadSubmit}>
                  <Field
                    label="Name"
                    type="text"
                    value={leadForm.name}
                    onChange={(value) => setLeadForm((current) => ({ ...current, name: value }))}
                  />
                  <Field
                    label="Phone"
                    type="tel"
                    value={leadForm.phone}
                    onChange={(value) => setLeadForm((current) => ({ ...current, phone: value }))}
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={leadForm.email}
                    onChange={(value) => setLeadForm((current) => ({ ...current, email: value }))}
                  />
                  <Field
                    label="Project details"
                    type="textarea"
                    value={leadForm.projectDetails}
                    onChange={(value) => setLeadForm((current) => ({ ...current, projectDetails: value }))}
                  />

                  <button
                    type="submit"
                    disabled={leadLoading || !result || !ruleBased}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {leadLoading ? "Saving lead..." : "Save lead & open WhatsApp"}
                  </button>
                </form>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                <p className="text-sm font-semibold text-white">BOQ auto-generate</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Suggested sections and auto-filled BOQ rows are prepared from the estimate below.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Suggested sections</p>
                    <p className="mt-2 text-sm text-slate-100">
                      Primary structure, secondary members, roof cladding, wall cladding, purlins, bracings
                    </p>
                  </div>

                  {boqRows.map((row) => (
                    <div
                      key={row.section}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium text-slate-100">{row.section}</span>
                        <span className="text-slate-300">{row.unit}</span>
                      </div>
                      <div className="mt-2 grid gap-1 text-slate-300 sm:grid-cols-2">
                        <span>Weight: {formatNumber(row.weightKg, 0)} kg</span>
                        <span>Cost: {formatCurrency(row.costInr)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/tools/ms-weight"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                  >
                    MS weight calculator
                  </Link>
                </div>

                {boqPayload ? (
                  <p className="mt-4 text-xs text-slate-400">
                    BOQ payload prepared with {boqPayload.items.length} rows and {formatCurrency(boqPayload.totalCost)} total.
                  </p>
                ) : null}
              </div>
            </aside>
          </div>

          <div className="border-t border-slate-800 px-6 py-6 sm:px-8">
            <div className="grid gap-4 lg:grid-cols-3">
              <StatCard
                label="Total steel"
                value={`${formatNumber(totalSteelMt, 3)} MT`}
                detail={`${formatNumber(totalSteelKg, 0)} kg total estimated steel`}
              />
              <StatCard
                label="Cost range"
                value={`${formatCurrency(totalCostMin)} - ${formatCurrency(totalCostMax)}`}
                detail="Fabrication + erection cost at ₹150/kg"
              />
              <StatCard
                label="AI distribution"
                value={`${breakdown.primaryPercent}% / ${breakdown.secondaryPercent}% / ${breakdown.claddingPercent}%`}
                detail="Primary / Secondary / Cladding"
              />
            </div>
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
  const isTextarea = type === "textarea";

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
        />
      ) : (
        <input
          type={type}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
        />
      )}
    </div>
  );
}

function MetricCard({
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

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}
