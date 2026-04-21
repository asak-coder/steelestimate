"use client";

import { useEffect, useMemo, useState } from "react";
import { request, saveBoqProject } from "../../../lib/api";
import { calculateBoqRowCost } from "../../../lib/costEngine";
import { buildBoqSavePayload, calculateBoqRowComputed, type BoqRowDraft } from "../../../lib/boq";

type SectionOption = {
  label: string;
  weightPerMeter: number;
  sourceType: string;
};

type RowForm = {
  id: string;
  section: string;
  length: string;
  quantity: string;
  weightPerMeter: string;
};

type ComputedRow = RowForm & {
  calculated: ReturnType<typeof calculateBoqRowComputed>;
};

const SECTION_LIST_ID = "boq-section-options";

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `boq-row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createRow(): RowForm {
  return {
    id: createId(),
    section: "",
    length: "0",
    quantity: "1",
    weightPerMeter: "0",
  };
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatMt(value: number) {
  return formatNumber(value / 1000, 3);
}

function normalizeText(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function resolveSectionOption(input: string, options: SectionOption[]) {
  const normalized = normalizeText(input);
  if (!normalized) return null;

  const exact = options.find((option) => normalizeText(option.label) === normalized);
  if (exact) return exact;

  const fuzzyMatches = options.filter((option) => {
    const label = normalizeText(option.label);
    return label.includes(normalized) || normalized.includes(label);
  });

  return fuzzyMatches.length === 1 ? fuzzyMatches[0] : null;
}

function collectSectionOptions(value: unknown, sink: SectionOption[], fallbackType = "") {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectSectionOptions(item, sink, fallbackType));
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const source = value as Record<string, unknown>;

  if (Array.isArray(source.data)) {
    collectSectionOptions(source.data, sink, fallbackType);
    return;
  }

  if (Array.isArray(source.items)) {
    collectSectionOptions(source.items, sink, fallbackType);
    return;
  }

  if (Array.isArray(source.sections)) {
    collectSectionOptions(source.sections, sink, fallbackType);
    return;
  }

  if (Array.isArray(source.results)) {
    collectSectionOptions(source.results, sink, fallbackType);
    return;
  }

  const label = String(
    source.designation ??
      source.name ??
      source.size ??
      source.section ??
      source.label ??
      source.title ??
      "",
  ).trim();

  const weightPerMeter = toNumber(
    source.weightPerMeter ?? source.weight_per_meter ?? source.weight ?? source.mass ?? source.wpm ?? source.weightKg,
    0,
  );

  if (label) {
    sink.push({
      label,
      weightPerMeter,
      sourceType: String(source.type ?? source.materialType ?? fallbackType ?? "").trim(),
    });
    return;
  }

  Object.entries(source).forEach(([key, nested]) => {
    if (key === "meta" || key === "pagination") return;
    collectSectionOptions(nested, sink, key);
  });
}

function toDraft(row: RowForm): BoqRowDraft {
  const section = String(row.section || "").trim();
  const length = Math.max(0, toNumber(row.length, 0));
  const quantity = Math.max(1, Math.floor(toNumber(row.quantity, 1)));
  const weightPerMeter = Math.max(0, toNumber(row.weightPerMeter, 0));

  return {
    id: row.id,
    type: "IS",
    section,
    dimensions: {
      length,
      quantity,
      weightPerMeter,
    },
    quantity,
    weight: 0,
    cost: 0,
  };
}

function createRowFromSection(option: SectionOption): RowForm {
  return {
    id: createId(),
    section: option.label,
    length: "0",
    quantity: "1",
    weightPerMeter: String(option.weightPerMeter || 0),
  };
}

export default function BoqBuilderPage() {
  const [rows, setRows] = useState<RowForm[]>(() => [createRow()]);
  const [sectionOptions, setSectionOptions] = useState<SectionOption[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loadingSections, setLoadingSections] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSections() {
      try {
        setLoadingSections(true);
        const response = await request("/api/sections", { method: "GET" });
        const options: SectionOption[] = [];
        collectSectionOptions(response?.data ?? response, options);

        if (mounted) {
          setSectionOptions(options);
        }
      } catch (error) {
        if (mounted) {
          setSectionOptions([]);
          setErrorMessage(error instanceof Error ? error.message : "Failed to load steel sections");
        }
      } finally {
        if (mounted) {
          setLoadingSections(false);
        }
      }
    }

    loadSections();

    return () => {
      mounted = false;
    };
  }, []);

  const computedRows = useMemo<ComputedRow[]>(
    () =>
      rows.map((row) => {
        const option = resolveSectionOption(row.section, sectionOptions);
        const normalizedRow = option
          ? {
              ...row,
              weightPerMeter: String(option.weightPerMeter ?? row.weightPerMeter ?? 0),
            }
          : row;

        return {
          ...normalizedRow,
          calculated: calculateBoqRowComputed(toDraft(normalizedRow)),
        };
      }),
    [rows, sectionOptions],
  );

  const totalWeightKg = computedRows.reduce((sum, row) => sum + row.calculated.weight, 0);
  const totalWeightMt = totalWeightKg / 1000;
  const costTotals = calculateBoqRowCost(totalWeightKg);

  function updateRow(rowId: string, updater: (row: RowForm) => RowForm) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;

        const nextRow = updater(row);
        const resolved = resolveSectionOption(nextRow.section, sectionOptions);

        return {
          ...nextRow,
          weightPerMeter: resolved ? String(resolved.weightPerMeter ?? 0) : nextRow.weightPerMeter,
        };
      }),
    );
  }

  function handleSectionChange(rowId: string, value: string) {
    updateRow(rowId, (row) => {
      const resolved = resolveSectionOption(value, sectionOptions);

      return {
        ...row,
        section: value,
        weightPerMeter: resolved ? String(resolved.weightPerMeter ?? 0) : "0",
      };
    });
  }

  function handleLengthChange(rowId: string, value: string) {
    updateRow(rowId, (row) => ({ ...row, length: value }));
  }

  function handleQuantityChange(rowId: string, value: string) {
    updateRow(rowId, (row) => ({
      ...row,
      quantity: String(Math.max(1, Math.floor(toNumber(value, 1)) || 1)),
    }));
  }

  function addRow() {
    setRows((current) => [...current, createRow()]);
  }

  function addRowFromSuggestion(option: SectionOption) {
    setRows((current) => [...current, createRowFromSection(option)]);
  }

  function removeRow(rowId: string) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== rowId) : current));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaveMessage("");
      setErrorMessage("");

      const payload = buildBoqSavePayload(rows.map(toDraft), projectName);
      const response = await saveBoqProject(payload);
      const saved = response?.data ?? response;

      setSaveMessage(
        saved?.id
          ? `Project saved successfully. Project ID: ${saved.id}`
          : "Project saved successfully.",
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save BOQ project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                BOQ Builder
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Multi-item steel quantity calculator
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Add steel rows, search the section name, enter length and quantity, and the calculator
                will total weight and cost automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            >
              + Add Row
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Project name</span>
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Optional project label"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition duration-200">
              {loadingSections ? "Loading section master..." : `${sectionOptions.length} sections loaded`}
            </div>
          </div>

          {saveMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 transition duration-200">
              {saveMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 transition duration-200">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Section search
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Length (m)
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Quantity
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Weight result
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Action
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {computedRows.map((row, index) => (
              <div
                key={row.id}
                className="px-6 py-5 transition duration-200 hover:bg-slate-50/80"
              >
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-center">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500 lg:hidden">
                      Section search
                    </label>
                    <input
                      value={row.section}
                      onChange={(event) => handleSectionChange(row.id, event.target.value)}
                      list={SECTION_LIST_ID}
                      placeholder="Search section..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-slate-500"
                    />
                    <div className="text-xs text-slate-500">
                      {row.weightPerMeter !== "0"
                        ? `${formatNumber(toNumber(row.weightPerMeter, 0))} kg/m`
                        : "Pick a section to auto-fill weight per meter"}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500 lg:hidden">
                      Length (m)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.length}
                      onChange={(event) => handleLengthChange(row.id, event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500 lg:hidden">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.quantity}
                      onChange={(event) => handleQuantityChange(row.id, event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-slate-500"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition duration-300">
                    <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      {index + 1}. row weight
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {formatNumber(row.calculated.weight)} kg
                    </div>
                    <div className="text-sm text-slate-600">{formatMt(row.calculated.weight)} MT</div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-600 transition duration-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove Row
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Total summary</p>
              <div className="mt-3 rounded-3xl bg-slate-900 px-5 py-5 text-white shadow-lg transition duration-300">
                <p className="text-xs uppercase tracking-[0.26em] text-slate-300">TOTAL</p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatNumber(totalWeightKg)} kg / {formatMt(totalWeightMt)} MT
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition duration-300">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Fabrication cost
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    ₹ {formatNumber(costTotals.fabricationCost)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition duration-300">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Erection cost
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    ₹ {formatNumber(costTotals.erectionCost)}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition duration-300">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
                    Total cost
                  </p>
                  <p className="mt-2 text-xl font-semibold text-emerald-900">
                    ₹ {formatNumber(costTotals.totalCost)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Project"}
              </button>

              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50"
              >
                + Add Another Row
              </button>

              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                The BOQ calculator auto-updates row weights and project totals as soon as the section,
                length, or quantity changes.
              </p>
            </div>
          </div>
        </section>
      </div>

      <datalist id={SECTION_LIST_ID}>
        {sectionOptions.map((option) => (
          <option key={`${option.sourceType}-${option.label}`} value={option.label} />
        ))}
      </datalist>
    </main>
  );
}
