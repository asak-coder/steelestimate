"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBoqProjects } from '../../../lib/api';

type ProjectSummary = {
  id?: string;
  _id?: string;
  projectName?: string;
  totalWeight?: number;
  totalCost?: number;
  items?: Array<unknown>;
  createdAt?: string;
  updatedAt?: string;
};

function formatNumber(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.00';
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setErrorMessage('');
        const response = await getBoqProjects();
        const data = response?.data ?? response;
        const items = Array.isArray(data) ? data : Array.isArray(data?.projects) ? data.projects : [];

        if (mounted) {
          setProjects(items);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load saved projects');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Saved BOQ Projects</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Reload and continue previous estimates</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Review stored BOQ projects, check totals, and reopen any item in the builder.
            </p>
          </div>

          <Link
            href="/dashboard/boq"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Open BOQ builder
          </Link>
        </div>

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
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total weight</th>
              <th className="px-4 py-3">Total cost</th>
              <th className="px-4 py-3">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Loading saved projects…
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No BOQ projects saved yet.
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const id = project.id ?? project._id ?? '';
                return (
                  <tr key={id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {project.projectName?.trim() || `Project ${id.slice(-6)}`}
                      </div>
                      <div className="text-xs text-slate-500">ID: {id}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{formatDate(project.createdAt)}</td>
                    <td className="px-4 py-4 text-slate-700">{project.items?.length ?? 0}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {formatNumber(project.totalWeight ?? 0)} kg
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      ₹ {formatNumber(project.totalCost ?? 0, 2)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/dashboard/boq?projectId=${id}`}
                        className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Reload
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}