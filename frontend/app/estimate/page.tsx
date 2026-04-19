"use client";

import { useEffect, useMemo, useState } from "react";
import { getSections } from "@/lib/api";
import { ismbSections, type StandardSection } from "@/lib/isDatabase";

type Mode = "manual" | "isStandard";
type StandardKey = "ISMB" | "ISMC" | "ISA";
type CalculationResult = {
  sectionName: string;
  standard: string;
  weightPerMeter: number;
  totalWeight: number;
};

const standardOptions: { key: StandardKey; label: string }[] = [
  { key: "ISMB", label: "ISMB" },
  { key: "ISMC", label: "ISMC" },
  { key: "ISA", label: "ISA" },
];

const formatNumber = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

export default function EstimatePage() {
  const [mode, setMode] = useState<Mode>("isStandard");
  const [sectionType, setSectionType] = useState<StandardKey>("ISMB");
  const [sectionSize, setSectionSize] = useState(ismbSections[0]?.size ?? "");
  const [length, setLength] = useState("6");
  const [quantity, setQuantity] = useState("1");
  const [manualSectionName, setManualSectionName] = useState("Manual Section");
  const [manualWeightPerMeter, setManualWeightPerMeter] = useState("0");
  const [standardLabel, setStandardLabel] = useState("IS 808");
  const [sectionsByType, setSectionsByType] = useState<Record<StandardKey, StandardSection[]>>({
    ISMB: [],
    ISMC: [],
    ISA: [],
  });
  const [loadingSections, setLoadingSections] = useState(true);
  const [sectionError, setSectionError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      setLoadingSections(true);
      setSectionError("");

      try {
        const response = await getSections();
        const items = Array.isArray(response?.data) ? response.data : [];

        const grouped = items.reduce(
          (acc: Record<StandardKey, StandardSection[]>, item: any) => {
            const key = String(item?.type || "").toUpperCase() as StandardKey;
            if (!acc[key]) return acc;

            const size = String(item?.designation || item?.name || "").trim();
            if (!size) return acc;

            acc[key].push({
              size,
              weightPerMeter: Number(item?.weight) || 0,
            });

            return acc;
          },
          { ISMB: [], ISMC: [], ISA: [] }
        );

        if (!cancelled) {
          const sourceSections = { ISMB: [] as StandardSection[], ISMC: [] as StandardSection[], ISA: [] as StandardSection[] };

          items.forEach((item: any) => {
            const key = String(item?.type || "").toUpperCase() as StandardKey;
            if (!sourceSections[key]) return;

            const size = String(item?.designation || item?.name || "").trim();
            if (!size) return;

            sourceSections[key].push({
              size,
              weightPerMeter: Number(item?.weight) || 0,
            });
          });

          (Object.keys(sourceSections) as StandardKey[]).forEach((key) => {
            sourceSections[key].sort((a: StandardSection, b: StandardSection) => Number(a.size) - Number(b.size));
          });

          setSectionsByType(sourceSections);

          if (!sourceSections[sectionType].length) {
            const firstType = (Object.keys(sourceSections) as StandardKey[]).find((key) => sourceSections[key].length);
            if (firstType) {
              setSectionType(firstType);
              setSectionSize(sourceSections[firstType][0]?.size ?? "");
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setSectionError(error instanceof Error ? error.message : "Failed to load sections");
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

  const selectedSection = useMemo(
    () => activeSections.find((item) => item.size === sectionSize) ?? activeSections[0],
    [activeSections, sectionSize]
  );

  const weightPerMeter =
    mode === "isStandard"
      ? selectedSection?.weightPerMeter ?? 0
      : Number(manualWeightPerMeter) || 0;

  const calculatedWeight =
    weightPerMeter * (Number(length) || 0) * (Number(quantity) || 0);

  const result: CalculationResult = {
    sectionName:
      mode === "isStandard"
        ? `${sectionType} ${selectedSection?.size ?? ""}`.trim()
        : manualSectionName.trim() || "Manual Section",
    standard: mode === "isStandard" ? "IS 808" : standardLabel.trim() || "Manual",
    weightPerMeter,
    totalWeight: calculatedWeight,
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {sectionError ? (
        <div className="mx-auto mb-4 max-w-7xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {sectionError}
        </div>
      ) : null}
      {loadingSections ? (
        <div className="mx-auto mb-4 max-w-7xl rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
          Loading steel section database...
        </div>
      ) : null}
      <div className="mx-auto max-w-7xl">
        <div className="industrial-card soft-fade-in rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-700/60 pb-6">
            <p className="industrial-muted text-xs uppercase tracking-[0.24em]">
              Engineer-grade steel weight calculator
            </p>
            <h1 className="industrial-heading text-2xl font-semibold sm:text-3xl">
              IS Standard Steel Section Weight Calculator
            </h1>
            <p className="industrial-muted text-sm sm:text-base">
              Fast selection for ISMB, ISMC, and ISA with auto-filled weight per meter.
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5">
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Selection Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("manual")}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        mode === "manual"
                          ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                          : "border-slate-700 bg-slate-950/40 text-slate-300"
                      }`}
                    >
                      Manual Input
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("isStandard")}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        mode === "isStandard"
                          ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                          : "border-slate-700 bg-slate-950/40 text-slate-300"
                      }`}
                    >
                      IS Standard
                    </button>
                  </div>
                </div>

                {mode === "isStandard" ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Section Type
                        </label>
                        <select
                          value={sectionType}
                          onChange={(e) => {
                            const nextType = e.target.value as StandardKey;
                            setSectionType(nextType);
                            const nextSections = sectionsByType[nextType] || [];
                            setSectionSize(nextSections[0]?.size ?? "");
                          }}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                          disabled={loadingSections}
                        >
                          {standardOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Section Size
                        </label>
                        <select
                          value={sectionSize}
                          onChange={(e) => setSectionSize(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                          disabled={loadingSections}
                        >
                          {activeSections.map((section) => (
                            <option key={section.size} value={section.size}>
                              {section.size}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field
                        label="Length (m)"
                        value={length}
                        onChange={setLength}
                        type="number"
                        step="0.01"
                      />
                      <Field
                        label="Quantity"
                        value={quantity}
                        onChange={setQuantity}
                        type="number"
                        step="1"
                      />
                      <Field
                        label="Weight / Meter"
                        value={formatNumber(weightPerMeter)}
                        onChange={() => {}}
                        readOnly
                        type="text"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Section Name"
                        value={manualSectionName}
                        onChange={setManualSectionName}
                        type="text"
                      />
                      <Field
                        label="Standard"
                        value={standardLabel}
                        onChange={setStandardLabel}
                        type="text"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field
                        label="Weight / Meter"
                        value={manualWeightPerMeter}
                        onChange={setManualWeightPerMeter}
                        type="number"
                        step="0.01"
                      />
                      <Field
                        label="Length (m)"
                        value={length}
                        onChange={setLength}
                        type="number"
                        step="0.01"
                      />
                      <Field
                        label="Quantity"
                        value={quantity}
                        onChange={setQuantity}
                        type="number"
                        step="1"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Calculation Summary
              </p>

              <div className="mt-4 space-y-4">
                <SummaryRow label="Section Name" value={result.sectionName} />
                <SummaryRow label="Standard" value={result.standard} />
                <SummaryRow
                  label="Weight per Meter"
                  value={`${formatNumber(result.weightPerMeter)} kg/m`}
                />
                <SummaryRow
                  label="Total Weight"
                  value={`${formatNumber(result.totalWeight)} kg`}
                  highlight
                />
              </div>

              <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300">
                <p className="font-medium text-cyan-200">Formula</p>
                <p className="mt-1">
                  Weight = weight_per_meter × length × quantity
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
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
        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 read-only:cursor-not-allowed read-only:bg-slate-900/70"
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
    <div className={`rounded-xl border px-4 py-3 ${highlight ? "border-cyan-400/30 bg-cyan-400/10" : "border-slate-700/60 bg-slate-900/40"}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-cyan-100" : "text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}
