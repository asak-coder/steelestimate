"use client";

import { useEffect, useMemo, useState } from "react";
import { createLead, getSections } from "@/lib/api";
import { calculateWeight, type MsSectionType, type MsWeightResult } from "@/lib/weightEngine";
import type { StandardSection } from "@/lib/isDatabase";

type StandardKey = Extract<MsSectionType, "ISMB" | "ISMC" | "ISA">;
type SmartSection = StandardSection & { designation: string };
type SectionRecord = Record<StandardKey, SmartSection[]>;

type LeadFormState = {
  name: string;
  phone: string;
  email: string;
  projectType: string;
};

const sectionOptions: { key: StandardKey; label: string }[] = [
  { key: "ISMB", label: "ISMB" },
  { key: "ISMC", label: "ISMC" },
  { key: "ISA", label: "ISA" },
];

const projectTypeOptions = [
  "Industrial Shed",
  "Warehouse",
  "Factory Building",
  "Structural Fabrication",
  "MS Staircase / Platform",
  "Other",
];

const formatNumber = (value: number) => (Number.isInteger(value) ? value.toString() : value.toFixed(2));

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const normalizeSectionLabel = (item: any) =>
  String(item?.designation ?? item?.name ?? item?.size ?? "").trim();

export default function MsWeightPage() {
  const [sectionType, setSectionType] = useState<StandardKey>("ISMB");
  const [sectionsByType, setSectionsByType] = useState<SectionRecord>({
    ISMB: [],
    ISMC: [],
    ISA: [],
  });
  const [selectedSectionDesignation, setSelectedSectionDesignation] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(0);
  const [lengthM, setLengthM] = useState("6");
  const [quantity, setQuantity] = useState("1");
  const [loadingSections, setLoadingSections] = useState(true);
  const [sectionError, setSectionError] = useState("");
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState("");
  const [leadWhatsAppLink, setLeadWhatsAppLink] = useState("");
  const [leadError, setLeadError] = useState("");
  const [leadForm, setLeadForm] = useState<LeadFormState>({
    name: "",
    phone: "",
    email: "",
    projectType: projectTypeOptions[0],
  });
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Hello, I used the SteelEstimate MS Weight Calculator and want a detailed BOQ + official quotation within 24 hours.`
  );
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : "";

  useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      setLoadingSections(true);
      setSectionError("");

      try {
        const responses = await Promise.all(
          sectionOptions.map(async ({ key }) => {
            const payload = await getSections(key);
            const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

            const normalized = items
              .map((item: any) => {
                const designation = normalizeSectionLabel(item);
                const size = designation;
                const weightPerMeter = Number(item?.weightPerMeter ?? item?.weight ?? 0);
                return designation ? ({ designation, size, weightPerMeter } as SmartSection) : null;
              })
              .filter((item: SmartSection | null): item is SmartSection => Boolean(item))
              .sort((a: SmartSection, b: SmartSection) => a.designation.localeCompare(b.designation, undefined, { numeric: true }));

            return [key, normalized] as const;
          })
        );

        if (cancelled) return;

        const nextSections: SectionRecord = { ISMB: [], ISMC: [], ISA: [] };
        responses.forEach(([key, items]) => {
          nextSections[key] = items;
        });

        if (cancelled) return;

        setSectionsByType(nextSections);

        const firstAvailableType = sectionOptions.find(({ key }) => nextSections[key].length)?.key;
        if (!firstAvailableType) {
          setSectionType("ISMB");
          setSelectedSectionDesignation("");
          setSectionSearch("");
          setSectionError("No sections available");
          return;
        }

        const firstSection = nextSections[firstAvailableType][0];
        setSectionType(firstAvailableType);
        setSelectedSectionDesignation(firstSection?.designation ?? "");
        setSectionSearch(firstSection?.designation ?? "");
      } catch (error) {
        if (!cancelled) {
          setSectionError("Failed to load sections");
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
    if (!activeSections.length) {
      if (selectedSectionDesignation || sectionSearch) {
        setSelectedSectionDesignation("");
        setSectionSearch("");
      }
      return;
    }

    const selectedExists = activeSections.some((section) => section.designation === selectedSectionDesignation);

    if (!selectedExists) {
      const firstSection = activeSections[0];
      setSelectedSectionDesignation(firstSection?.designation ?? "");
      setSectionSearch(firstSection?.designation ?? "");
      setHighlightedSuggestionIndex(0);
    }
  }, [activeSections, sectionSearch, selectedSectionDesignation]);

  useEffect(() => {
    if (!sectionSearch.trim()) {
      setHighlightedSuggestionIndex(0);
      return;
    }

    const exactMatch = activeSections.find(
      (section) => section.designation.toLowerCase() === sectionSearch.trim().toLowerCase()
    );

    if (exactMatch && exactMatch.designation !== selectedSectionDesignation) {
      setSelectedSectionDesignation(exactMatch.designation);
    }

    setHighlightedSuggestionIndex(0);
  }, [activeSections, sectionSearch, selectedSectionDesignation]);

  const filteredSections = useMemo(() => {
    const search = sectionSearch.trim().toLowerCase();
    const matches = search
      ? activeSections.filter((section) => section.designation.toLowerCase().includes(search))
      : activeSections;

    return matches.slice(0, 10);
  }, [activeSections, sectionSearch]);

  const selectedSection = useMemo(
    () => activeSections.find((section) => section.designation === selectedSectionDesignation) ?? activeSections[0],
    [activeSections, selectedSectionDesignation]
  );

  const lengthValue = Number(lengthM);
  const quantityValue = Number(quantity);
  const validationError =
    !selectedSection
      ? activeSections.length
        ? "Please select a section"
        : "No sections available"
      : !Number.isFinite(lengthValue) || lengthValue <= 0
        ? "Enter a valid length in meters"
        : !Number.isFinite(quantityValue) || quantityValue <= 0
          ? "Enter a valid quantity"
          : "";

  const result: MsWeightResult = calculateWeight(sectionType, {
    size: selectedSection?.designation,
    lengthM: Number.isFinite(lengthValue) && lengthValue > 0 ? lengthValue : 0,
    quantity: Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 0,
    weightPerMeter: selectedSection?.weightPerMeter ?? 0,
  });

  const weightKg = result.totalWeightKg;
  const mt = weightKg / 1000;

  const fabricationRate = 80;
  const erectionRate = 70;

  const fabricationCost = weightKg * fabricationRate;
  const erectionCost = weightKg * erectionRate;
  const totalCost = fabricationCost + erectionCost;
  const estimatedLow = totalCost * 0.9;
  const estimatedHigh = totalCost * 1.1;

  const openLeadForm = () => {
    setLeadSuccess("");
    setLeadWhatsAppLink("");
    setLeadError("");
    setLeadFormOpen(true);
  };

  const closeLeadForm = () => {
    if (leadSubmitting) return;
    setLeadFormOpen(false);
  };

  const selectSection = (section: SmartSection) => {
    setSelectedSectionDesignation(section.designation);
    setSectionSearch(section.designation);
    setIsSuggestionOpen(false);
    setHighlightedSuggestionIndex(0);
  };

  const handleSearchChange = (value: string) => {
    setSectionSearch(value);
    setIsSuggestionOpen(true);
    setHighlightedSuggestionIndex(0);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredSections.length) {
      if (event.key === "Escape") {
        setIsSuggestionOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsSuggestionOpen(true);
      setHighlightedSuggestionIndex((current) => (current + 1) % filteredSections.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsSuggestionOpen(true);
      setHighlightedSuggestionIndex((current) => (current - 1 + filteredSections.length) % filteredSections.length);
      return;
    }

    if (event.key === "Enter") {
      if (isSuggestionOpen && filteredSections[highlightedSuggestionIndex]) {
        event.preventDefault();
        selectSection(filteredSections[highlightedSuggestionIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsSuggestionOpen(false);
    }
  };

  const submitLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLeadSubmitting(true);
    setLeadError("");
    setLeadSuccess("");
    setLeadWhatsAppLink("");

    try {
      const response = await createLead({
        estimateId: `ms-weight-${Date.now()}`,
        clientName: leadForm.name.trim(),
        phone: leadForm.phone.trim(),
        email: leadForm.email.trim(),
        notes: `Project Type: ${leadForm.projectType}. Source: weight_calculator.`,
        source: "api",
        consent: true,
        name: leadForm.name.trim(),
        message: "Get full project estimate & BOQ",
        projectData: {
          tool: "ms-weight",
          projectType: leadForm.projectType,
          sectionType: sectionType,
          materialType: sectionType,
          sectionName: result.sectionName,
          sectionSize: selectedSection?.designation ?? "",
          lengthM: Number(lengthM) || 0,
          quantity: Number(quantity) || 0,
          weight: weightKg,
          weightKg,
          totalWeightKg: weightKg,
          mt,
          fabricationRate,
          erectionRate,
          fabricationCost,
          erectionCost,
          totalCost,
          estimatedRangePercent: 10,
          source: "weight_calculator",
        },
        cost: {
          fabricationCost,
          erectionCost,
          totalCost,
        },
      });

      const payload = response && typeof response === "object" ? response : null;
      const whatsappLink =
        payload?.automation?.whatsappLink ||
        payload?.data?.whatsappLink ||
        payload?.data?.whatsapp?.link ||
        (whatsappHref || "");

      setLeadSuccess("Your estimate request has been submitted. Our team will contact you shortly.");
      setLeadWhatsAppLink(whatsappLink);

      if (whatsappLink && typeof window !== "undefined") {
        window.open(whatsappLink, "_blank", "noopener,noreferrer");
      }

      setLeadForm({
        name: "",
        phone: "",
        email: "",
        projectType: projectTypeOptions[0],
      });
      setLeadFormOpen(false);
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : "Unable to submit lead");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const showSuggestions = isSuggestionOpen && (filteredSections.length > 0 || sectionSearch.trim().length > 0);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        {sectionError ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {sectionError}
          </div>
        ) : null}

        {leadSuccess ? (
          <div className="mb-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-50 shadow-lg shadow-emerald-950/20 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  Request received successfully
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Thank you for your enquiry
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100/90 sm:text-base">
                  {leadSuccess}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:min-w-[220px]">
                {leadWhatsAppLink ? (
                  <a
                    href={leadWhatsAppLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Continue on WhatsApp
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setLeadSuccess("")}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-300"
                >
                  Back to calculator
                </button>
              </div>
            </div>
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
              Select an IS section, search instantly by designation, calculate total weight, and turn the
              result into an estimated project cost with lead capture.
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
                        onClick={() => {
                          setSectionType(option.key);
                          const nextSection = sectionsByType[option.key]?.[0];
                          setSelectedSectionDesignation(nextSection?.designation ?? "");
                          setSectionSearch(nextSection?.designation ?? "");
                          setHighlightedSuggestionIndex(0);
                          setIsSuggestionOpen(false);
                        }}
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
                  <div className="relative">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Section Search
                    </label>
                    <input
                      value={sectionSearch}
                      onChange={(event) => handleSearchChange(event.target.value)}
                      onFocus={() => setIsSuggestionOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setIsSuggestionOpen(false), 120);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search section (e.g. ISMB 200)"
                      disabled={loadingSections || !activeSections.length}
                      aria-expanded={showSuggestions}
                      aria-autocomplete="list"
                      aria-controls="section-suggestions-list"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                    />

                    {showSuggestions ? (
                      <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40">
                        <div
                          id="section-suggestions-list"
                          role="listbox"
                          className="max-h-80 overflow-auto py-2"
                        >
                          {filteredSections.length ? (
                            filteredSections.map((section, index) => {
                              const isSelected = section.designation === selectedSectionDesignation;
                              const isHighlighted = index === highlightedSuggestionIndex;
                              return (
                                <button
                                  key={`${section.designation}-${section.weightPerMeter}`}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    selectSection(section);
                                  }}
                                  className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm transition ${
                                    isHighlighted
                                      ? "bg-blue-500/10 text-white"
                                      : "text-slate-200 hover:bg-slate-900"
                                  } ${isSelected ? "ring-1 ring-inset ring-blue-400/40" : ""}`}
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate font-medium">{section.designation}</span>
                                    <span className="mt-0.5 block text-xs text-slate-400">
                                      {isSelected ? "Selected section" : "Click to select"}
                                    </span>
                                  </span>
                                  <span className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                                    {formatNumber(section.weightPerMeter)} kg/m
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-4 py-3 text-sm text-slate-400">No matching sections found</div>
                          )}
                        </div>
                      </div>
                    ) : null}
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

                {selectedSection ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
                    Selected section:{" "}
                    <span className="font-semibold text-blue-100">{selectedSection.designation}</span>
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Live calculation
              </p>

              {validationError ? (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  {validationError}
                </div>
              ) : null}

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

              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 soft-fade-in">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Estimated Cost
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {formatCurrency(totalCost)}
                </p>
                <p className="mt-2 text-sm text-slate-200">Breakup:</p>
                <div className="mt-3 space-y-2 text-sm text-slate-100">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 px-4 py-3">
                    <span className="text-slate-300">Fabrication</span>
                    <span className="font-semibold">{formatCurrency(fabricationCost)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 px-4 py-3">
                    <span className="text-slate-300">Erection</span>
                    <span className="font-semibold">{formatCurrency(erectionCost)}</span>
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium text-emerald-100">Estimated range: ±10%</p>
                <p className="mt-1 text-xs text-slate-300">
                  Approx. {formatCurrency(estimatedLow)} to {formatCurrency(estimatedHigh)}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
                <p className="text-sm font-semibold text-blue-100">
                  🚀 Get Detailed BOQ + Official Quotation (Within 24 Hours)
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-200">
                  Capture project details, share the estimate with our team, and reach us instantly on WhatsApp.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={openLeadForm}
                    className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 active:scale-[0.99]"
                  >
                    Get Detailed BOQ + Official Quotation (Within 24 Hours)
                  </button>
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      Chat on WhatsApp
                    </a>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm font-semibold text-slate-300">
                      WhatsApp number not configured
                    </span>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {leadFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Lead form</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Get full project estimate & BOQ</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Share your details and we'll follow up with a project estimate.
                </p>
              </div>
              <button
                type="button"
                onClick={closeLeadForm}
                className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitLead} className="space-y-4 px-6 py-6">
              {leadError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {leadError}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={leadForm.name}
                  onChange={(value) => setLeadForm((current) => ({ ...current, name: value }))}
                  type="text"
                />
                <Field
                  label="Phone"
                  value={leadForm.phone}
                  onChange={(value) => setLeadForm((current) => ({ ...current, phone: value }))}
                  type="tel"
                />
              </div>

              <Field
                label="Email"
                value={leadForm.email}
                onChange={(value) => setLeadForm((current) => ({ ...current, email: value }))}
                type="email"
              />

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Project Type
                </label>
                <select
                  value={leadForm.projectType}
                  onChange={(e) => setLeadForm((current) => ({ ...current, projectType: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
                >
                  {projectTypeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
                <p className="font-semibold text-slate-100">Current estimate</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span>Section</span>
                    <span className="font-medium text-slate-100">{result.sectionName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Total Weight</span>
                    <span className="font-medium text-slate-100">{formatNumber(weightKg)} kg</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Estimated Cost</span>
                    <span className="font-semibold text-emerald-100">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={closeLeadForm}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leadSubmitting}
                  className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {leadSubmitting ? "Submitting..." : "Submit & get estimate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500 read-only:cursor-not-allowed read-only:bg-slate-900/80"
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
        highlight ? "border-blue-500/30 bg-blue-500/10" : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-blue-100" : "text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}
