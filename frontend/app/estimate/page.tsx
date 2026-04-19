"use client";

import { useEffect, useMemo, useState } from "react";
import { getSections } from "@/lib/api";
import { ismbSections, type StandardSection } from "@/lib/isDatabase";
import { calculateWeight as calculateMsWeight, type MsSectionType } from "@/lib/weightEngine";

type Mode = "manual" | "isStandard";
type StandardKey = MsSectionType;
type RowPreset = "section" | "plate" | "pipe";
type CalculationResult = {
  sectionName: string;
  standard: string;
  weightPerMeter: number;
  totalWeightKg: number;
  totalWeightMt: number;
};

type RowState = {
  id: string;
  preset: RowPreset;
  mode: Mode;
  sectionType: StandardKey;
  sectionSize: string;
  manualSectionName: string;
  manualWeightPerMeter: string;
  standardLabel: string;
  length: string;
  quantity: string;
  plateLength: string;
  plateWidth: string;
  plateThickness: string;
  pipeOuterDiameter: string;
  pipeInnerDiameter: string;
  sectionNotes: string;
};

const standardOptions: { key: StandardKey; label: string }[] = [
  { key: "ISMB", label: "ISMB" },
  { key: "ISMC", label: "ISMC" },
  { key: "ISA", label: "ISA" },
];

const presetOptions: { key: RowPreset; label: string; hint: string }[] = [
  { key: "section", label: "Section", hint: "IS section quick pick" },
  { key: "plate", label: "Plate", hint: "Length × width × thickness" },
  { key: "pipe", label: "Pipe", hint: "Outer and inner diameter" },
];

const initialRows = (): RowState[] => [
  {
    id: "row-1",
    preset: "section",
    mode: "isStandard",
    sectionType: "ISMB",
    sectionSize: ismbSections[0]?.size ?? "",
    manualSectionName: "Manual Section",
    manualWeightPerMeter: "0",
    standardLabel: "IS 808",
    length: "6",
    quantity: "1",
    plateLength: "",
    plateWidth: "",
    plateThickness: "",
    pipeOuterDiameter: "",
    pipeInnerDiameter: "",
    sectionNotes: "",
  },
];

const formatNumber = (value: number) => (Number.isInteger(value) ? value.toString() : value.toFixed(2));
const formatMt = (value: number) => (value / 1000).toFixed(3);

function createRow(preset: RowPreset, index: number, sectionType: StandardKey): RowState {
  return {
    id: `row-${Date.now()}-${index}`,
    preset,
    mode: preset === "section" ? "isStandard" : "manual",
    sectionType,
    sectionSize: "",
    manualSectionName: preset === "plate" ? "Plate" : preset === "pipe" ? "Pipe" : "Manual Section",
    manualWeightPerMeter: "0",
    standardLabel: preset === "section" ? "IS 808" : "",
    length: preset === "section" ? "6" : "",
    quantity: "1",
    plateLength: preset === "plate" ? "" : "",
    plateWidth: preset === "plate" ? "" : "",
    plateThickness: preset === "plate" ? "" : "",
    pipeOuterDiameter: preset === "pipe" ? "" : "",
    pipeInnerDiameter: preset === "pipe" ? "" : "",
    sectionNotes: "",
  };
}

function createPresetRow(preset: RowPreset, current: RowState, sectionType: StandardKey): RowState {
  return {
    ...current,
    preset,
    mode: preset === "section" ? "isStandard" : "manual",
    sectionType: preset === "section" ? sectionType : current.sectionType,
    sectionSize: preset === "section" ? current.sectionSize : "",
    manualSectionName: preset === "plate" ? "Plate" : preset === "pipe" ? "Pipe" : "Manual Section",
    manualWeightPerMeter: preset === "section" ? current.manualWeightPerMeter : "0",
    standardLabel: preset === "section" ? "IS 808" : "",
    length: preset === "section" || preset === "pipe" ? current.length || "1" : current.length,
    quantity: current.quantity || "1",
    plateLength: preset === "plate" ? current.plateLength : "",
    plateWidth: preset === "plate" ? current.plateWidth : "",
    plateThickness: preset === "plate" ? current.plateThickness : "",
    pipeOuterDiameter: preset === "pipe" ? current.pipeOuterDiameter : "",
    pipeInnerDiameter: preset === "pipe" ? current.pipeInnerDiameter : "",
    sectionNotes: current.sectionNotes,
  };
}

export default function EstimatePage() {
  const [rows, setRows] = useState<RowState[]>(initialRows);
  const [sectionType, setSectionType] = useState<StandardKey>("ISMB");
  const [sectionSize, setSectionSize] = useState(ismbSections[0]?.size ?? "");
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
        const grouped: Record<StandardKey, StandardSection[]> = { ISMB: [], ISMC: [], ISA: [] };

        items.forEach((item: any) => {
          const key = String(item?.type || "").toUpperCase() as StandardKey;
          if (!grouped[key]) return;

          const size = String(item?.designation || item?.name || "").trim();
          if (!size) return;

          grouped[key].push({
            size,
            weightPerMeter: Number(item?.weight) || 0,
          });
        });

        (Object.keys(grouped) as StandardKey[]).forEach((key) => {
          grouped[key].sort((a, b) => Number(a.size) - Number(b.size));
        });

        if (!cancelled) {
          setSectionsByType(grouped);

          const firstType = (Object.keys(grouped) as StandardKey[]).find((key) => grouped[key].length);
          if (firstType) {
            setSectionType(firstType);
            setSectionSize(grouped[firstType][0]?.size ?? "");
            setRows((current) =>
              current.map((row) =>
                row.preset === "section" && row.mode === "isStandard"
                  ? {
                      ...row,
                      sectionType: firstType,
                      sectionSize: grouped[firstType][0]?.size ?? "",
                    }
                  : row
              )
            );
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

  const rowsWithResults = useMemo(
    () =>
      rows.map((row) => {
        const selectedSection =
          row.mode === "isStandard"
            ? (sectionsByType[row.sectionType] || []).find((item) => item.size === row.sectionSize) ||
              (sectionsByType[row.sectionType] || [])[0]
            : null;

        let totalWeightKg = 0;
        let weightPerMeter = 0;
        let sectionName = row.manualSectionName.trim() || "Manual Section";
        let standard = row.mode === "isStandard" ? "IS 808" : row.standardLabel.trim() || "Manual";

        if (row.mode === "isStandard") {
          const result = calculateMsWeight(row.sectionType, {
            size: selectedSection?.size ?? row.sectionSize,
            lengthM: Number(row.length) || 0,
            quantity: Number(row.quantity) || 1,
            weightPerMeter: selectedSection?.weightPerMeter ?? 0,
          });

          sectionName = result.sectionName;
          weightPerMeter = result.weightPerMeter;
          totalWeightKg = result.totalWeightKg;
        } else {
          if (row.preset === "plate") {
            const lengthM = Number(row.plateLength) || 0;
            const widthM = Number(row.plateWidth) || 0;
            const thicknessM = Number(row.plateThickness) || 0;
            const density = 7850;
            weightPerMeter = widthM && thicknessM ? widthM * thicknessM * density : 0;
            totalWeightKg = lengthM && widthM && thicknessM ? lengthM * widthM * thicknessM * density * (Number(row.quantity) || 1) : 0;
            sectionName = row.manualSectionName.trim() || "Plate";
            standard = row.standardLabel.trim() || "Plate";
          } else if (row.preset === "pipe") {
            const outer = Number(row.pipeOuterDiameter) || 0;
            const inner = Number(row.pipeInnerDiameter) || 0;
            const lengthM = Number(row.length) || 0;
            const quantity = Number(row.quantity) || 1;
            const density = 7850;
            const area = outer > inner ? Math.PI * (((outer / 1000) / 2) ** 2 - ((inner / 1000) / 2) ** 2) : 0;
            totalWeightKg = area && lengthM ? area * lengthM * density * quantity : 0;
            weightPerMeter = area ? area * density : 0;
            sectionName = row.manualSectionName.trim() || "Pipe";
            standard = row.standardLabel.trim() || "Pipe";
          } else {
            weightPerMeter = Number(row.manualWeightPerMeter) || 0;
            totalWeightKg = weightPerMeter * (Number(row.length) || 0) * (Number(row.quantity) || 1);
          }
        }

        return {
          ...row,
          sectionName,
          standard,
          weightPerMeter,
          totalWeightKg,
          totalWeightMt: totalWeightKg / 1000,
        };
      }),
    [rows, sectionsByType]
  );

  const totalWeightKg = rowsWithResults.reduce((sum, row) => sum + row.totalWeightKg, 0);
  const totalWeightMt = totalWeightKg / 1000;

  const primaryResult = rowsWithResults[0] ?? {
    sectionName: "No rows",
    standard: "-",
    weightPerMeter: 0,
    totalWeightKg: 0,
    totalWeightMt: 0,
  };

  const result: CalculationResult = {
    sectionName: primaryResult.sectionName,
    standard: primaryResult.standard,
    weightPerMeter: primaryResult.weightPerMeter,
    totalWeightKg,
    totalWeightMt,
  };

  const addRow = (preset: RowPreset) => {
    setRows((current) => [...current, createRow(preset, current.length + 1, sectionType)]);
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  };

  const updateRow = (id: string, updater: (row: RowState) => RowState) => {
    setRows((current) => current.map((row) => (row.id === id ? updater(row) : row)));
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
              Fast multi-row estimates with kg and MT output, plus quick presets for section, plate, and pipe inputs.
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5">
              <div className="flex flex-wrap gap-3">
                {presetOptions.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => addRow(preset.key)}
                    className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-left text-sm text-slate-200 hover:border-cyan-400/60 hover:bg-cyan-400/10"
                  >
                    <div className="font-semibold">{preset.label}</div>
                    <div className="text-xs text-slate-400">{preset.hint}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {rowsWithResults.map((row, index) => (
                  <div key={row.id} className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Row {index + 1}</p>
                        <p className="text-sm font-semibold text-slate-100">{row.sectionName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-red-400/60 hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Input Preset
                        </label>
                        <select
                          value={row.preset}
                          onChange={(e) =>
                            updateRow(row.id, (current) =>
                              createPresetRow(e.target.value as RowPreset, current, sectionType)
                            )
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                        >
                          <option value="section">Section</option>
                          <option value="plate">Plate</option>
                          <option value="pipe">Pipe</option>
                        </select>
                      </div>

                      {row.preset === "section" ? (
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Selection Mode
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                updateRow(row.id, (current) => ({
                                  ...current,
                                  mode: "manual",
                                }))
                              }
                              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                row.mode === "manual"
                                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                                  : "border-slate-700 bg-slate-950/40 text-slate-300"
                              }`}
                            >
                              Manual Input
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateRow(row.id, (current) => ({
                                  ...current,
                                  mode: "isStandard",
                                }))
                              }
                              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                row.mode === "isStandard"
                                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                                  : "border-slate-700 bg-slate-950/40 text-slate-300"
                              }`}
                            >
                              IS Standard
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      {row.preset === "section" && row.mode === "isStandard" ? (
                        <>
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Section Type
                            </label>
                            <select
                              value={row.sectionType}
                              onChange={(e) => {
                                const nextType = e.target.value as StandardKey;
                                const nextSections = sectionsByType[nextType] || [];
                                updateRow(row.id, (current) => ({
                                  ...current,
                                  sectionType: nextType,
                                  sectionSize: nextSections[0]?.size ?? "",
                                }));
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
                              value={row.sectionSize}
                              onChange={(e) =>
                                updateRow(row.id, (current) => ({
                                  ...current,
                                  sectionSize: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                              disabled={loadingSections}
                            >
                              {(sectionsByType[row.sectionType] || []).map((section) => (
                                <option key={section.size} value={section.size}>
                                  {section.size}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Field
                            label="Length (m)"
                            value={row.length}
                            onChange={(value) => updateRow(row.id, (current) => ({ ...current, length: value }))}
                            type="number"
                            step="0.01"
                          />
                        </>
                      ) : row.preset === "plate" ? (
                        <>
                          <Field
                            label="Length (m)"
                            value={row.plateLength}
                            onChange={(value) => updateRow(row.id, (current) => ({ ...current, plateLength: value }))}
                            type="number"
                            step="0.01"
                          />
                          <Field
                            label="Width (m)"
                            value={row.plateWidth}
                            onChange={(value) => updateRow(row.id, (current) => ({ ...current, plateWidth: value }))}
                            type="number"
                            step="0.01"
                          />
                          <Field
                            label="Thickness (m)"
                            value={row.plateThickness}
                            onChange={(value) =>
                              updateRow(row.id, (current) => ({ ...current, plateThickness: value }))
                            }
                            type="number"
                            step="0.001"
                          />
                        </>
                      ) : row.preset === "pipe" ? (
                        <>
                          <Field
                            label="Outer Diameter (mm)"
                            value={row.pipeOuterDiameter}
                            onChange={(value) =>
                              updateRow(row.id, (current) => ({ ...current, pipeOuterDiameter: value }))
                            }
                            type="number"
                            step="0.01"
                          />
                          <Field
                            label="Inner Diameter (mm)"
                            value={row.pipeInnerDiameter}
                            onChange={(value) =>
                              updateRow(row.id, (current) => ({ ...current, pipeInnerDiameter: value }))
                            }
                            type="number"
                            step="0.01"
                          />
                          <Field
                            label="Length (m)"
                            value={row.length}
                            onChange={(value) => updateRow(row.id, (current) => ({ ...current, length: value }))}
                            type="number"
                            step="0.01"
                          />
                        </>
                      ) : (
                        <>
                          <Field
                            label="Section Name"
                            value={row.manualSectionName}
                            onChange={(value) =>
                              updateRow(row.id, (current) => ({ ...current, manualSectionName: value }))
                            }
                            type="text"
                          />
                          <Field
                            label="Standard"
                            value={row.standardLabel}
                            onChange={(value) =>
                              updateRow(row.id, (current) => ({ ...current, standardLabel: value }))
                            }
                            type="text"
                          />
                          <Field
                            label="Weight / Meter"
                            value={row.manualWeightPerMeter}
                            onChange={(value) =>
                              updateRow(row.id, (current) => ({ ...current, manualWeightPerMeter: value }))
                            }
                            type="number"
                            step="0.01"
                          />
                        </>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <Field
                        label="Quantity"
                        value={row.quantity}
                        onChange={(value) => updateRow(row.id, (current) => ({ ...current, quantity: value }))}
                        type="number"
                        step="1"
                      />
                      <SummaryRow label="Weight / Meter" value={`${formatNumber(row.weightPerMeter)} kg/m`} />
                      <SummaryRow
                        label="Row Total"
                        value={`${formatNumber(row.totalWeightKg)} kg · ${formatMt(row.totalWeightKg)} MT`}
                        highlight
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => addRow("section")} className="btn-secondary">
                  Add Section Row
                </button>
                <button type="button" onClick={() => addRow("plate")} className="btn-secondary">
                  Add Plate Row
                </button>
                <button type="button" onClick={() => addRow("pipe")} className="btn-secondary">
                  Add Pipe Row
                </button>
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Calculation Summary
              </p>

              <div className="mt-4 space-y-4">
                <SummaryRow label="Primary Row" value={result.sectionName} />
                <SummaryRow label="Standard" value={result.standard} />
                <SummaryRow label="Weight per Meter" value={`${formatNumber(result.weightPerMeter)} kg/m`} />
                <SummaryRow
                  label="Total Weight"
                  value={`${formatNumber(result.totalWeightKg)} kg · ${formatMt(result.totalWeightKg)} MT`}
                  highlight
                />
                <SummaryRow
                  label="All Rows Total"
                  value={`${formatNumber(totalWeightKg)} kg · ${formatMt(totalWeightKg)} MT`}
                  highlight
                />
              </div>

              <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300">
                <p className="font-medium text-cyan-200">Formula</p>
                <p className="mt-1">Total = sum of row weights across all materials</p>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <button type="button" className="btn-primary w-full">
                  Use this weight for project estimate
                </button>
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        step={step}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
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
      className={`rounded-xl border px-4 py-3 ${
        highlight ? "border-cyan-400/30 bg-cyan-400/10" : "border-slate-700/60 bg-slate-900/40"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-cyan-100" : "text-slate-100"}`}>{value}</p>
    </div>
  );
}