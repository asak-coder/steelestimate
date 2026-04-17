'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const initialForm = {
  length: '',
  width: '',
  height: '',
  location: '',
  crane: '',
  clientName: '',
  phone: '',
  email: ''
};

const loadingSteps = [
  'Analyzing structure design...',
  'Optimizing steel weight...',
  'Calculating cost...',
  'Generating quotation...'
];

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numeric);
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2
  }).format(numeric);
}

function getDeepValue(source, keys) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }

  return undefined;
}

function normalizeResponse(response) {
  const root = response && typeof response === 'object' && response.data && typeof response.data === 'object'
    ? response.data
    : response || {};

  const area = getDeepValue(root, ['area', 'builtUpArea', 'buildingArea', 'shedArea', 'sqftArea', 'squareFeet']);
  const steelWeight = getDeepValue(root, ['steelWeight', 'steel_weight', 'weight', 'steelWeightKg', 'steel_weight_kg']);
  const costEstimate = getDeepValue(root, ['costEstimate', 'estimate', 'quotation', 'price', 'totalCost', 'total', 'amount']);
  const costPerSqft = getDeepValue(root, ['costPerSqft', 'cost_per_sqft', 'ratePerSqft', 'rate']);
  const quotationUrl = getDeepValue(root, ['quotationUrl', 'downloadUrl', 'fileUrl', 'pdfUrl']);
  const contactUrl = getDeepValue(root, ['contactUrl', 'whatsappUrl']);
  const leadId = getDeepValue(root, ['leadId', 'id', '_id']);

  return {
    area,
    steelWeight,
    costEstimate,
    costPerSqft,
    quotationUrl,
    contactUrl,
    leadId,
    raw: root
  };
}

function getErrorMessage(error, fallback = 'Unable to generate estimate. Please try again.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return fallback;
}

function buildApiPayload(form) {
  const craneValue = form.crane.trim().toLowerCase();
  const isCraneRequired = craneValue === 'yes' || craneValue === 'true' || craneValue === '1' || craneValue === 'y';
  const parsedCraneCapacity = Number(craneValue.replace(/[^\d.]/g, ''));
  const craneCapacity = Number.isFinite(parsedCraneCapacity) ? parsedCraneCapacity : 0;

  return {
    length: Number(form.length),
    width: Number(form.width),
    height: Number(form.height),
    location: form.location.trim(),
    crane: isCraneRequired,
    craneCapacity,
    clientName: form.clientName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim()
  };
}

function getApiErrorPayload(error) {
  if (!error) return null;
  if (typeof error === 'string') return { message: error };
  if (error.payload && typeof error.payload === 'object') return error.payload;
  return null;
}

export default function EstimatePage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const resultRef = useRef(null);

  const phoneDigits = useMemo(() => form.phone.replace(/[^\d]/g, ''), [form.phone]);
  const whatsappLink = useMemo(() => {
    if (!phoneDigits) return 'https://wa.me/';
    return `https://wa.me/${phoneDigits}`;
  }, [phoneDigits]);

  const contactLink = useMemo(() => {
    if (result?.contactUrl) return result.contactUrl;
    if (phoneDigits) return `tel:${phoneDigits}`;
    return 'tel:';
  }, [result?.contactUrl, phoneDigits]);

  useEffect(() => {
    if (status !== 'loading') return undefined;

    let active = true;
    let index = 0;
    setLoadingStepIndex(0);
    setMessage(loadingSteps[0]);

    const timers = [];

    loadingSteps.slice(1).forEach((step, stepIndex) => {
      const timer = window.setTimeout(() => {
        if (!active) return;
        index = stepIndex + 1;
        setLoadingStepIndex(index);
        setMessage(step);
      }, 1100 * (stepIndex + 1));

      timers.push(timer);
    });

    return () => {
      active = false;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'success') return;
    const timer = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [status, result]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const nextErrors = {};
    const required = ['length', 'width', 'height', 'location', 'crane', 'clientName', 'phone', 'email'];

    required.forEach((field) => {
      if (!String(form[field] || '').trim()) {
        nextErrors[field] = 'This field is required.';
      }
    });

    if (form.length && Number(form.length) <= 0) nextErrors.length = 'Enter a value greater than zero.';
    if (form.width && Number(form.width) <= 0) nextErrors.width = 'Enter a value greater than zero.';
    if (form.height && Number(form.height) <= 0) nextErrors.height = 'Enter a value greater than zero.';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (form.phone && !/^[0-9+\-\s()]{7,}$/.test(form.phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    if (form.crane && !/^(yes|no|y|n|true|false|1|0|\d+(\.\d+)?)$/i.test(form.crane.trim())) {
      nextErrors.crane = 'Enter Yes/No or crane capacity.';
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus('idle');
      return;
    }

    setErrors({});
    setStatus('loading');
    setResult(null);
    setLoadingStepIndex(0);
    setMessage(loadingSteps[0]);

    try {
      const response = await fetch('/api/peb-calc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildApiPayload(form))
      });

      const text = await response.text();
      let payload = null;

      try {
        payload = text ? JSON.parse(text) : null;
      } catch (parseError) {
        payload = text ? { message: text } : null;
      }

      if (!response.ok) {
        const apiErrorPayload = getApiErrorPayload(payload);
        throw new Error((apiErrorPayload && apiErrorPayload.message) || (payload && payload.message) || 'Quotation request failed.');
      }

      const normalized = normalizeResponse(payload);
      setResult(normalized);
      setStatus('success');
      setMessage('Quotation generated successfully.');
    } catch (error) {
      setStatus('error');
      setMessage(getErrorMessage(error));
    }
  }

  const resultCards = [
    { label: 'Area (sqm)', value: formatNumber(result?.area) },
    { label: 'Steel weight (kg)', value: formatNumber(result?.steelWeight) },
    { label: 'Estimated cost (₹)', value: formatCurrency(result?.costEstimate) },
    { label: 'Cost per sqft', value: formatCurrency(result?.costPerSqft) }
  ];

  const resultReady = Boolean(result);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
            <div className="mb-8 space-y-4">
              <span className="inline-flex items-center rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Instant industrial quotation
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Get a professional PEB estimate instantly
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Share your project details below and get a clean, fast quotation for industrial sheds, warehouses,
                  and steel structures.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Length', name: 'length', type: 'number', placeholder: 'e.g. 100' },
                  { label: 'Width', name: 'width', type: 'number', placeholder: 'e.g. 50' },
                  { label: 'Height', name: 'height', type: 'number', placeholder: 'e.g. 12' },
                  { label: 'Location', name: 'location', type: 'text', placeholder: 'Project location' },
                  { label: 'Crane requirement', name: 'crane', type: 'text', placeholder: 'Yes / No / Capacity' },
                  { label: 'Client name', name: 'clientName', type: 'text', placeholder: 'Your full name' },
                  { label: 'Phone number', name: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                  { label: 'Email address', name: 'email', type: 'email', placeholder: 'name@company.com' }
                ].map((field) => (
                  <label key={field.name} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-200">
                      {field.label} <span className="text-rose-300">*</span>
                    </span>
                    <input
                      type={field.type}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 ${
                        errors[field.name] ? 'border-rose-400' : 'border-white/10'
                      }`}
                      aria-invalid={Boolean(errors[field.name])}
                      aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                    />
                    {errors[field.name] ? (
                      <p id={`${field.name}-error`} className="mt-2 text-xs text-rose-300">
                        {errors[field.name]}
                      </p>
                    ) : null}
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="inline-flex items-center justify-center rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === 'loading' ? 'Calculating...' : 'Get Estimate'}
                </button>
                <a
                  href="#results"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-white/10"
                >
                  View estimate
                </a>
              </div>

              {message ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    status === 'error'
                      ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                      : 'border-sky-400/30 bg-sky-500/10 text-sky-100'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </div>
              ) : null}

              {status === 'loading' ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Generating quotation</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Step {loadingStepIndex + 1} of {loadingSteps.length}
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {loadingSteps.map((step, index) => (
                      <div key={step} className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            index <= loadingStepIndex ? 'bg-sky-400' : 'bg-slate-700'
                          }`}
                        />
                        <p className={`text-sm ${index <= loadingStepIndex ? 'text-slate-100' : 'text-slate-500'}`}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </form>
          </div>

          <aside ref={resultRef} id="results" className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30 sm:p-8">
              <h2 className="text-xl font-semibold text-white">What you will receive</h2>
              <div className="mt-5 grid gap-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Fast estimate for project planning and discussion
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Steel weight, area, and cost summary in a professional format
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Direct contact options for immediate next steps
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Quotation result</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {resultReady ? 'Estimate generated successfully.' : 'Your estimate will appear here after submission.'}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  {status === 'success' ? 'Ready' : 'Pending'}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {resultCards.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                    <p className="mt-3 text-2xl font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Final cost may vary after site inspection
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={result?.quotationUrl || '#'}
                  target={result?.quotationUrl ? '_blank' : undefined}
                  rel={result?.quotationUrl ? 'noreferrer' : undefined}
                  aria-disabled={!result?.quotationUrl}
                  className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    result?.quotationUrl
                      ? 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                      : 'cursor-not-allowed bg-slate-700 text-slate-300 opacity-70'
                  }`}
                  onClick={(event) => {
                    if (!result?.quotationUrl) event.preventDefault();
                  }}
                >
                  Download Full Quotation
                </a>
                <a
                  href={contactLink}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-white/10"
                >
                  Contact Now
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                >
                  WhatsApp Us
                </a>
              </div>

              {!result?.quotationUrl ? (
                <p className="mt-3 text-xs text-slate-400">
                  Download will be enabled automatically when the backend returns a quotation file URL.
                </p>
              ) : null}

              {status === 'error' ? (
                <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {message}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}