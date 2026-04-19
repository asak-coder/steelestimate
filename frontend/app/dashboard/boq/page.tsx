"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  buildBoqSavePayload,
  calculateBoqRowComputed,
  createEmptyBoqRow,
  normalizeBoqRow,
  type BoqMaterialType,
  type BoqRowDraft,
} from '../../../lib/boq';
import { exportBoqProject, getBoqProject, saveBoqProject } from '../../../lib/api';

declare global {
  interface Window {
    __STEEL_ESTIMATE_USER__?: Record<string, unknown> | null;
  }
}

type SectionOptionsMap = Record<BoqMaterialType, string[]>;

const FALLBACK_SECTION_OPTIONS: SectionOptionsMap = {
  IS: ['ISMB 100', 'ISMB 125', 'ISMB 150', 'ISMB 200', 'ISMB 250', 'ISMB 300'],
  PLATE: ['PLATE 6 mm', 'PLATE 8 mm', 'PLATE 10 mm', 'PLATE 12 mm', 'PLATE 16 mm', 'PLATE 20 mm'],
  PIPE: ['PIPE 15 NB', 'PIPE 20 NB', 'PIPE 25 NB', 'PIPE 40 NB', 'PIPE 50 NB', 'PIPE 80 NB'],
};

const MATERIAL_LABELS: Record<BoqMaterialType, string> = {
  IS: 'IS',
  PLATE: 'PLATE',
  PIPE: 'PIPE',
};

function createDefaultDimensions(type: BoqMaterialType): Record<string, number> {
  if (type === 'PLATE') {
    return { length: 0, width: 0, thickness: 0 };
  }

  if (type === 'PIPE') {
    return { length: 0, outerDiameter: 0, thickness: 0 };
  }

  return { length: 0 };
}

function normalizeSectionMap(data: unknown): SectionOptionsMap {
  if (!data || typeof data !== 'object') {
    return FALLBACK_SECTION_OPTIONS;
  }

  const fallback = { ...FALLBACK_SECTION_OPTIONS };
  const source = data as Record<string, unknown>;

  const pickList = (value: unknown, type: BoqMaterialType) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (value && typeof value === 'object') {
      const nested = value as Record<string, unknown>;
      const candidates = [nested.items, nested.sections, nested.data];
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate.map((item) => String(item).trim()).filter(Boolean);
        }
      }
    }

    return fallback[type];
  };

  return {
    IS: pickList(source.IS ?? source.is, 'IS'),
    PLATE: pickList(source.PLATE ?? source.plate, 'PLATE'),
    PIPE: pickList(source.PIPE ?? source.pipe, 'PIPE'),
  };
}

function formatNumber(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.00';
}

function toNumber(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePlanKey(value: unknown) {
  if (!value) return 'free';
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes('premium')) return 'premium';
  if (normalized.includes('pro')) return 'pro';
  if (normalized.includes('basic')) return 'basic';
  if (normalized.includes('free')) return 'free';
  return 'free';
}

function extractPlanFromUser(user: unknown) {
  if (!user || typeof user !== 'object') return 'free';

  const candidate = user as Record<string, unknown>;
  const subscription =
    candidate.subscription && typeof candidate.subscription === 'object'
      ? (candidate.subscription as Record<string, unknown>)
      : null;

  const values = [
    candidate.planType,
    candidate.plan,
    subscription?.plan,
    subscription?.planType,
    subscription?.premium ? 'premium' : null,
  ];

  for (const value of values) {
    const plan = normalizePlanKey(value);
    if (plan !== 'free') return plan;
  }

  return 'free';
}

function readCachedUser() {
  if (typeof window === 'undefined') return null;

  const preferredKeys = [
    'steelestimate-user',
    'steelestimate_user',
    'steelestimate-auth-user',
    'authUser',
    'currentUser',
    'user',
  ];

  for (const key of preferredKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (_) {
      // ignore malformed cache entries
    }
  }

  return window.__STEEL_ESTIMATE_USER__ && typeof window.__STEEL_ESTIMATE_USER__ === 'object'
    ? window.__STEEL_ESTIMATE_USER__
    : null;
}

function isPaidPlan(planKey: string) {
  return normalizePlanKey(planKey) !== 'free';
}

function sanitizeFilenamePart(value: string) {
  return String(value || '')
    .trim()
    .replace(/[^\w\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildExportFilename(projectName: string, format: 'pdf' | 'excel') {
  const safeName = sanitizeFilenamePart(projectName || 'boq-export');
  return `${safeName || 'boq-export'}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
}

function getExportMessage(planKey: string) {
  if (isPaidPlan(planKey)) {
    return 'BOQ export is unlocked on your current plan.';
  }

  return 'BOQ export is available on paid plans only. Upgrade to download PDF or Excel files.';
}

export default function BoqBuilderPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [rows, setRows] = useState<BoqRowDraft[]>(() => [createEmptyBoqRow()]);
  const [projectName, setProjectName] = useState('');
  const [sectionOptions, setSectionOptions] = useState<SectionOptionsMap>(FALLBACK_SECTION_OPTIONS);
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingProject, setLoadingProject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | ''>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<Record<string, unknown> | null>(null);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(projectId);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncUser = () => {
      const cachedUser = readCachedUser();
      if (cachedUser) {
        setCurrentUser(cachedUser as Record<string, unknown>);
      }
    };

    syncUser();
    window.addEventListener('steelestimate-auth-change', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('steelestimate-auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSections() {
      try {
        setLoadingSections(true);
        const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
        const endpoint = apiBase ? `${apiBase}/api/sections` : '/api/sections';
        const response = await fetch(endpoint, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Unable to load section options');
        }

        const data = await response.json();
        if (mounted) {
          setSectionOptions(normalizeSectionMap(data?.data ?? data));
        }
      } catch {
        if (mounted) {
          setSectionOptions(FALLBACK_SECTION_OPTIONS);
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

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let mounted = true;

    async function loadProject() {
      try {
        setLoadingProject(true);
        setErrorMessage('');
        const response = await getBoqProject(projectId);
        const project = response?.data ?? response;
        const items = Array.isArray(project?.items) ? project.items : [];
        const nextRows = items.length
          ? items.map((item: any) =>
              calculateBoqRowComputed(
                normalizeBoqRow({
                  id: item?.id,
                  type: item?.type,
                  section: item?.section,
                  dimensions: item?.dimensions,
                  quantity: 1,
                  weight: item?.weight,
                  cost: item?.cost,
                }),
              ),
            )
          : [createEmptyBoqRow()];

        if (mounted) {
          setProjectName(project?.projectName ?? '');
          setSavedProjectId(project?.id || project?._id || projectId || null);
          setRows(nextRows);
          setSuccessMessage('');
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load project');
        }
      } finally {
        if (mounted) {
          setLoadingProject(false);
        }
      }
    }

    loadProject();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  const currentPlanKey = useMemo(() => extractPlanFromUser(currentUser), [currentUser]);
  const canExportBoq = useMemo(() => isPaidPlan(currentPlanKey), [currentPlanKey]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const normalized = calculateBoqRowComputed(row);
        acc.totalWeight += normalized.weight;
        acc.totalCost += normalized.cost;
        return acc;
      },
      { totalWeight: 0, totalCost: 0 },
    );
  }, [rows]);

  function updateRow(rowId: string, updater: (row: BoqRowDraft) => BoqRowDraft) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        return calculateBoqRowComputed(updater(row));
      }),
    );
  }

  function handleTypeChange(rowId: string, type: BoqMaterialType) {
    updateRow(rowId, (row) => {
      const section = sectionOptions[type]?.[0] ?? '';
      return normalizeBoqRow({
        ...row,
        type,
        section,
        dimensions: createDefaultDimensions(type),
        quantity: 1,
      });
    });
  }

  function handleSectionChange(rowId: string, section: string) {
    updateRow(rowId, (row) => normalizeBoqRow({ ...row, section }));
  }

  function handleQuantityChange(rowId: string, quantity: string) {
    updateRow(rowId, (row) => normalizeBoqRow({ ...row, quantity: Math.max(1, Math.floor(toNumber(quantity) || 1)) }));
  }

  function handleDimensionChange(rowId: string, key: string, value: string) {
    updateRow(rowId, (row) =>
      normalizeBoqRow({
        ...row,
        dimensions: {
          ...row.dimensions,
          [key]: value,
        },
      }),
    );
  }

  function addRow() {
    setRows((currentRows) => [...currentRows, createEmptyBoqRow()]);
  }

  function removeRow(rowId: string) {
    setRows((currentRows) => {
      if (currentRows.length <= 1) {
        return currentRows;
      }

      return currentRows.filter((row) => row.id !== rowId);
    });
  }

  async function handleSave() {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const payload = buildBoqSavePayload(rows, projectName);
      const response = await saveBoqProject(payload);
      const savedProject = response?.data ?? response;

      if (savedProject?.items?.length) {
        const nextRows = savedProject.items.map((item: any) =>
          calculateBoqRowComputed(
            normalizeBoqRow({
              type: item?.type,
              section: item?.section,
              dimensions: item?.dimensions,
              quantity: 1,
              weight: item?.weight,
              cost: item?.cost,
            }),
          ),
        );
        setRows(nextRows);
      }

      const nextSavedProjectId = savedProject?.id || savedProject?._id || savedProjectId || projectId || null;
      setSavedProjectId(nextSavedProjectId);
      setSuccessMessage('BOQ project saved successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save BOQ project');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(format: 'pdf' | 'excel') {
    if (!canExportBoq) {
      setErrorMessage(getExportMessage(currentPlanKey));
      setSuccessMessage('');
      return;
    }

    if (!savedProjectId) {
      setErrorMessage('Save the BOQ project before exporting.');
      setSuccessMessage('');
      return;
    }

    try {
      setExportFormat(format);
      setErrorMessage('');
      setSuccessMessage('');

      const blob = (await exportBoqProject({
        projectId: savedProjectId,
        format,
      })) as Blob;

      if (typeof window === 'undefined') {
        throw new Error('Export is only available in the browser.');
      }

      const filename = buildExportFilename(projectName || 'boq-export', format);
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage(`${format.toUpperCase()} downloaded successfully.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `Failed to download ${format.toUpperCase()}`);
    } finally {
      setExportFormat('');
    }
  }

  const totalWeightMt = totals.totalWeight / 1000;
  const exportStatusMessage = getExportMessage(currentPlanKey);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">BOQ Builder</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Create and save steel estimate projects</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Add multiple BOQ rows, calculate per-row weight and cost, then save the final estimate for later reuse.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/projects"
              className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              View saved projects
            </Link>
            <button
              type="button"
              onClick={addRow}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Add row
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex min-w-[260px] flex-1 flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Project name</span>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Optional project label"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
            />
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {loadingSections ? 'Loading section options…' : 'Section options ready'}
          </div>

          {loadingProject ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Loading saved project…
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {exportStatusMessage}
        </div>

        {successMessage ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Dimensions</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Weight (kg)</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => {
              const computed = calculateBoqRowComputed(row);
              const options = sectionOptions[row.type] ?? [];
              return (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-4">
                    <select
                      value={row.type}
                      onChange={(event) => handleTypeChange(row.id, event.target.value as BoqMaterialType)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-slate-500"
                    >
                      {Object.entries(MATERIAL_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={row.section}
                      onChange={(event) => handleSectionChange(row.id, event.target.value)}
                      className="w-full min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-slate-500"
                    >
                      <option value="">Select section</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <div className="grid min-w-[280px] gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500">Length (m)</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={String(row.dimensions.length ?? '')}
                          onChange={(event) => handleDimensionChange(row.id, 'length', event.target.value)}
                          className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
                        />
                      </label>

                      {row.type === 'PLATE' ? (
                        <>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-500">Width (m)</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={String(row.dimensions.width ?? '')}
                              onChange={(event) => handleDimensionChange(row.id, 'width', event.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-500">Thickness (mm)</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={String(row.dimensions.thickness ?? '')}
                              onChange={(event) => handleDimensionChange(row.id, 'thickness', event.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
                            />
                          </label>
                        </>
                      ) : null}

                      {row.type === 'PIPE' ? (
                        <>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-500">Outer diameter (mm)</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={String(row.dimensions.outerDiameter ?? '')}
                              onChange={(event) => handleDimensionChange(row.id, 'outerDiameter', event.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-500">Thickness (mm)</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={String(row.dimensions.thickness ?? '')}
                              onChange={(event) => handleDimensionChange(row.id, 'thickness', event.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
                            />
                          </label>
                        </>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.quantity}
                      onChange={(event) => handleQuantityChange(row.id, event.target.value)}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
                    />
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">{formatNumber(computed.weight)}</td>
                  <td className="px-4 py-4 font-medium text-slate-900">₹ {formatNumber(computed.cost, 2)}</td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Totals</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Total weight</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totals.totalWeight)} kg</p>
              <p className="mt-1 text-sm text-slate-600">{formatNumber(totalWeightMt, 3)} MT</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Total cost</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹ {formatNumber(totals.totalCost, 2)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Rows</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{rows.length}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3">
          <p className="text-sm text-slate-600">
            Save the current BOQ to the database or reload an existing project to continue editing.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={saving || exportFormat === 'pdf' || !canExportBoq}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportFormat === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('excel')}
              disabled={saving || exportFormat === 'excel' || !canExportBoq}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportFormat === 'excel' ? 'Preparing Excel…' : 'Download Excel'}
            </button>
          </div>

          {!canExportBoq ? (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Upgrade to export BOQ
            </Link>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save BOQ project'}
          </button>
        </div>
      </div>
    </section>
  );
}
