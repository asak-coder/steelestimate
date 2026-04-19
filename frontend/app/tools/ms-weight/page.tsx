"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateWeight, type MsSectionType, type MsWeightResult } from "@/lib/weightEngine";
import type { StandardSection } from "@/lib/isDatabase";

type StandardKey = MsSectionType;
type SectionRecord = Record<StandardKey, StandardSection[]>;

const sectionOptions: { key: StandardKey; label: string }[] = [
  { key: "ISMB", label: "ISMB" },
  { key: "ISMC", label: "ISMC" },
  { key: "ISA", label: "ISA" },
];

const formatNumber = (value: number) => (Number.isInteger(value) ? value.toString() : value.toFixed(2));

export default function MsWeightPage() {
  const [sectionType, setSectionType] = useState<StandardKey>("ISMB");
  const [sectionsByType, setSectionsByType] = useState<SectionRecord>({
    ISMB: [],
    ISMC: [],
    ISA: [],
  });
  const [sectionSize, setSectionSize] = useState("");
  const [lengthM, setLengthM] = useState("6");
  const [quantity, setQuantity] = useState("1");
  const [loadingSections, setLoadingSections] = useState(true);
  const [sectionError, setSectionError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      setLoadingSections(true);
      setSectionError("");

      try {
        const responses = await Promise.all(
          sectionOptions.map(async ({ key }) => {
            const response = await fetch(`/api/sections/${key}`);
            if (!response.ok) {
              throw new Error(`Failed to load ${key} sections`);
            }

            const payload = await response.json();
            const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

            const normalized = items
              .map((item: any) => {
                const size = String(item?.designation ?? item?.name ?? item?.size ?? "").trim();
                const weightPerMeter = Number(item?.weightPerMeter ?? item?.weight ?? 0);
                return size ? ({ size, weightPerMeter } as StandardSection) : null;
              })
              .filter((item: StandardSection | null): item is StandardSection => Boolean(item))
              .sort((a: StandardSection, b: StandardSection) => a.size.localeCompare(b.size, undefined, { numeric: true }));

            return [key, normalized] as const;
          })
        );

        if (cancelled) return;

        const nextSections: SectionRecord = { ISMB: [], ISMC: [], ISA: [] };
        responses.forEach(([key, items]) => {
          nextSections[key] = items;
        });

        setSectionsByType(nextSections);

        const firstAvailableType = sectionOptions.find(({ key }) => nextSections[key].length)?.key ?? "ISMB";
        const firstAvailableSize = nextSections[firstAvailableType][0]?.size ?? "";

        setSectionType(firstAvailableType);
        setSectionSize(firstAvailableSize);
      } catch (error) {
        if (!cancelled) {
          setSectionError(error instanceof Error ? error.message : "Failed to load steel sections");
        }
      } finally {
        if (!cancelled) setLoadingSections(false);
      }
    }

    loadSections();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeSections = useMemo(() => sectionsByType[sectionType] || [], [sectionType, sectionsByType]);

  useEffect(() => {
    if (!activeSections.length) return;
    const hasCurrentSize = activeSections.some((section) => section.size === sectionSize);
    if (!hasCurrentSize) {
      setSectionSize(activeSections[0]?.size ?? "");
    }
  }, [activeSections, sectionSize]);

  const selectedSection = useMemo(
    () => activeSections.find((section) => section.size === sectionSize) ?? activeSections[0],
    [activeSections, sectionSize]
  );

  const result: MsWeightResult = calculateWeight(sectionType, {
    size: selectedSection?.size,
    lengthM: Number(lengthM) || 0,
    quantity: Number(quantity) || 0,
    weightPerMeter: selectedSection?.weightPerMeter ?? 0,
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        {sectionError ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {sectionError}
          </div>
        ) : null}

        {loadingSections ? (
          <div className="mb-4 rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
            Loading section database...
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/30">
          <div className="border-b border-slate-800 px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Universal MS weight calculator
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              MS Weight Calculator
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              Select an IS section, pick a size from the live API, and calculate total weight using
              deterministic weight-per-meter data.
            </p>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6">
              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Section Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {sectionOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSectionType(option.key)}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                          sectionType === option.key
                            ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
                            : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Section Size
                    </label>
                    <select
                      value={sectionSize}
                      onChange={(e) => setSectionSize(e.target.value)}
                      disabled={loadingSections}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
                    >
                      {activeSections.length ? (
                        activeSections.map((section) => (
                          <option key={section.size} value={section.size}>
                            {section.size}
                          </option>
                        ))
                      ) : (
                        <option value="">No sections available</option>
                      )}
                    </select>
                  </div>

                  <Field
                    label="Length (m)"
                    value={lengthM}
                    onChange={setLengthM}
                    type="number"
                    step="0.01"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Quantity"
                    value={quantity}
                    onChange={setQuantity}
                    type="number"
                    step="1"
                  />
                  <Field
                    label="Weight / Meter"
                    value={formatNumber(selectedSection?.weightPerMeter ?? 0)}
                    onChange={() => {}}
                    type="text"
                    readOnly
                  />
                </div>
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Live calculation
              </p>

              <div className="mt-4 space-y-4">
                <SummaryRow label="Section" value={result.sectionName} />
                <SummaryRow label="Weight per Meter" value={`${formatNumber(result.weightPerMeter)} kg/m`} />
                <SummaryRow label="Length" value={`${formatNumber(Number(lengthM) || 0)} m`} />
                <SummaryRow label="Quantity" value={quantity || "0"} />
                <SummaryRow
                  label="Total Weight"
                  value={`${formatNumber(result.totalWeightKg)} kg`}
                  highlight
                />
              </div>

              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-slate-200 soft-fade-in">
                <p className="font-semibold text-blue-100">Formula</p>
                <p className="mt-1">Weight = weight_per_meter × length × quantity</p>
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
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  step?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        step={step}
        readOnly={readOnly}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 read-only:cursor-not-allowed read-only:bg-slate-900/80"
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 transition ${
        highlight
          ? "border-blue-500/30 bg-blue-500/10"
          : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-blue-100" : "text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}
