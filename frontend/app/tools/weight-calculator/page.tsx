'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  calculateWeight,
  formatKg,
  getMaterialDescription,
  getMaterialLabel,
  type CalculatorMode,
  type MaterialType,
} from '../../../lib/weightCalculator';

type FormState = {
  materialType: MaterialType;
  mode: CalculatorMode;
  quantity: string;
  diameterMm: string;
  widthMm: string;
  thicknessMm: string;
  sideMm: string;
  outerDiameterMm: string;
  innerDiameterMm: string;
  lengthMm: string;
  lengthM: string;
  widthM: string;
  heightMm: string;
  thicknessM: string;
};

const initialState: FormState = {
  materialType: 'round-bar',
  mode: 'single',
  quantity: '1',
  diameterMm: '20',
  widthMm: '50',
  thicknessMm: '10',
  sideMm: '25',
  outerDiameterMm: '60',
  innerDiameterMm: '48',
  lengthMm: '1000',
  lengthM: '1',
  widthM: '1',
  heightMm: '0',
  thicknessM: '10',
};

const fieldLabels: Record<string, string> = {
  diameterMm: 'Diameter',
  widthMm: 'Width',
  thicknessMm: 'Thickness',
  sideMm: 'Side',
  outerDiameterMm: 'Outer diameter',
  innerDiameterMm: 'Inner diameter',
  lengthMm: 'Length',
  lengthM: 'Length',
  widthM: 'Width',
  heightMm: 'Height',
  thicknessM: 'Thickness',
};

const fieldUnits: Record<string, string> = {
  diameterMm: 'mm',
  widthMm: 'mm',
  thicknessMm: 'mm',
  sideMm: 'mm',
  outerDiameterMm: 'mm',
  innerDiameterMm: 'mm',
  lengthMm: 'mm',
  lengthM: 'm',
  widthM: 'm',
  heightMm: 'mm',
  thicknessM: 'm',
};

const materialFields: Record<MaterialType, Array<keyof FormState>> = {
  'round-bar': ['diameterMm', 'lengthMm'],
  'flat-bar': ['widthMm', 'thicknessMm', 'lengthMm'],
  'plate': ['lengthMm', 'widthMm', 'thicknessMm'],
  'square-bar': ['sideMm', 'lengthMm'],
  'pipe': ['outerDiameterMm', 'innerDiameterMm', 'lengthMm'],
};

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function Field({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-slate-200">{label}</span>
      <div className="flex items-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950/80 focus-within:border-blue-500">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500"
        />
        <span className="whitespace-nowrap border-l border-slate-700 px-3 py-3 text-sm text-slate-400">{unit}</span>
      </div>
    </label>
  );
}

export default function WeightCalculatorPage() {
  const [form, setForm] = useState<FormState>(initialState);

  const result = useMemo(() => {
    const payload = {
      materialType: form.materialType,
      mode: form.mode,
      quantity: toNumber(form.quantity),
      density: 7850,
      diameterMm: toNumber(form.diameterMm),
      widthMm: toNumber(form.widthMm),
      thicknessMm: toNumber(form.thicknessMm),
      sideMm: toNumber(form.sideMm),
      outerDiameterMm: toNumber(form.outerDiameterMm),
      innerDiameterMm: toNumber(form.innerDiameterMm),
      lengthMm: toNumber(form.lengthMm),
      lengthM: toNumber(form.lengthM),
      widthM: toNumber(form.widthM),
      heightMm: toNumber(form.heightMm),
      thicknessM: toNumber(form.thicknessM),
    };

    return calculateWeight(payload);
  }, [form]);

  const activeFields = materialFields[form.materialType];

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200">
              Steel weight calculator
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Calculate steel weight instantly with deterministic formulas
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Choose a material type, enter dimensions in millimeters or meters, and get an immediate weight result in kilograms.
              All calculations use a fixed steel density of 7850 kg/m³.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="block text-sm font-medium text-slate-200">Material type</span>
                <select
                  value={form.materialType}
                  onChange={(event) => update('materialType', event.target.value as MaterialType)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="round-bar">Round bar</option>
                  <option value="flat-bar">Flat bar</option>
                  <option value="plate">Plate</option>
                  <option value="square-bar">Square bar</option>
                  <option value="pipe">Pipe</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-200">Quantity</span>
                <div className="flex items-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950/80 focus-within:border-blue-500">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(event) => update('quantity', event.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-slate-100 outline-none"
                  />
                  <span className="border-l border-slate-700 px-3 py-3 text-sm text-slate-400">pcs</span>
                </div>
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-200">Calculation mode</span>
                <select
                  value={form.mode}
                  onChange={(event) => update('mode', event.target.value as CalculatorMode)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="single">Single piece</option>
                  <option value="multiple">Multiple pieces</option>
                </select>
              </label>

              {activeFields.map((fieldKey) => (
                <Field
                  key={fieldKey}
                  label={fieldLabels[fieldKey]}
                  unit={fieldUnits[fieldKey]}
                  value={form[fieldKey]}
                  onChange={(value) => update(fieldKey, value)}
                />
              ))}

              <div className="sm:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm leading-6 text-slate-300">
                <div className="font-semibold text-slate-100">{getMaterialLabel(form.materialType)}</div>
                <div>{getMaterialDescription(form.materialType)}</div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <div className="overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-blue-950/20 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-200">Live result</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Weight summary</h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Density</div>
                  <div className="text-sm font-semibold text-white">7850 kg/m³</div>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 ease-out motion-safe:transform motion-safe:transition-transform motion-safe:hover:-translate-y-1">
                  <div className="text-sm text-slate-300">Total weight</div>
                  <div className="mt-2 text-4xl font-semibold tracking-tight text-white">{formatKg(result.weightKg)}</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm text-slate-300">Unit weight</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{formatKg(result.unitWeightKg)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm text-slate-300">Volume</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{result.volumeM3} m³</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
                  Deterministic formulas only. No AI-based estimation is used in this calculator.
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin/estimate"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Create estimate in admin
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}