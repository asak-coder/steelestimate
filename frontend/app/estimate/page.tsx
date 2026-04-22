"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShapePreview from "@/components/ShapePreview";
import { calculateWeight, type MsSectionType } from "@/lib/weightEngine";
import { formatCurrency } from "@/lib/format";
import { trackCalculatorUsage } from "@/lib/api";
import { isStandardDatabases, type StandardSection } from "@/lib/isDatabase";

type MaterialType = Extract<MsSectionType, "ISMB" | "ISMC" | "ISA" | "PIPE" | "PLATE">;
type ShapeKind = "ismb" | "pipe" | "plate";

type MaterialOption = {
  key: MaterialType;
  label: string;
  hint: string;
  shape: ShapeKind;
};

type CalculationResult = {
  sectionName: string;
  materialLabel: string;
  sizeLabel: string;
  weightPerMeter: number;
  totalWeightKg: number;
  totalWeightMt: number;
  estimatedCost: number;
};

type EstimateDraft = {
  material: MaterialType;
  length: string;
  quantity: string;
  ratePerKg: string;
  sectionSize: string;
  sizeSearch: string;
  pipeOuterDiameterMm: string;
  pipeInnerDiameterMm: string;
  plateWidthMm: string;
  plateThicknessMm: string;
  advancedOpen: boolean;
};

const STORAGE_KEY = "steelestimate:estimate:last";
const COMPANY_NAME = "SteelEstimate";

const MATERIAL_OPTIONS: MaterialOption[] = [
  { key: "ISMB", label: "ISMB", hint: "Standard beam sections", shape: "ismb" },
  { key: "ISMC", label: "ISMC", hint: "Channel sections", shape: "ismb" },
  { key: "ISA", label: "ISA", hint: "Angle sections", shape: "ismb" },
  { key: "PIPE", label: "Pipe", hint: "Circular hollow sections", shape: "pipe" },
  { key: "PLATE", label: "Plate", hint: "Plate and flat stock", shape: "plate" },
];

const DEFAULT_RATE = 80;

function getSectionsForType(material: MaterialType): StandardSection[] {
  return isStandardDatabases[material as keyof typeof isStandardDatabases] ?? [];
}

function useDebouncedValue<T>(value: T, delay = 180) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatWeightKg(value: number) {
  return `${formatNumber(value, 3)} kg`;
}

function formatWeightMt(value: number) {
  return `${formatNumber(value / 1000, 3)} MT`;
}

function getMaterialOption(material: MaterialType) {
  return MATERIAL_OPTIONS.find((option) => option.key === material) ?? MATERIAL_OPTIONS[0];
}

function getShapeKind(material: MaterialType): ShapeKind {
  return getMaterialOption(material).shape;
}

function isMaterialType(value: string): value is MaterialType {
  return MATERIAL_OPTIONS.some((option) => option.key === value);
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "estimate";
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdfBytes(lines: string[]) {
  const encoder = new TextEncoder();
  const header = "%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n";

  const contentStream = [
    "BT",
    "/F1 16 Tf",
    "72 780 Td",
    `(${escapePdfText(lines[0] ?? COMPANY_NAME)}) Tj`,
    "/F1 11 Tf",
    "18 TL",
    ...lines.slice(1).map((line) => `T*\n(${escapePdfText(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${encoder.encode(contentStream).length} >>\nstream\n${contentStream}\nendstream`,
  ];

  let pdf = header;
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdf);
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function EstimatePage() {
  const [material, setMaterial] = useState<MaterialType>("ISMB");
  const [length, setLength] = useState("6");
  const [quantity, setQuantity] = useState("1");
  const [ratePerKg, setRatePerKg] = useState(String(DEFAULT_RATE));
  const [sectionSize, setSectionSize] = useState("");
  const [sizeSearch, setSizeSearch] = useState("");
  const [pipeOuterDiameterMm, setPipeOuterDiameterMm] = useState("");
  const [pipeInnerDiameterMm, setPipeInnerDiameterMm] = useState("");
  const [plateWidthMm, setPlateWidthMm] = useState("");
  const [plateThicknessMm, setPlateThicknessMm] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hasStoredCalculation, setHasStoredCalculation] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showWhatsappHint, setShowWhatsappHint] = useState(false);
  const usageTrackedRef = useRef(false);

  const debouncedSizeSearch = useDebouncedValue(sizeSearch, 180);

  const sections = useMemo<StandardSection[]>(() => getSectionsForType(material), [material]);
  const filteredSections = useMemo(() => {
    const query = debouncedSizeSearch.trim().toLowerCase();
    if (!query) return sections;

    return sections.filter((section) => section.size.toLowerCase().includes(query));
  }, [debouncedSizeSearch, sections]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHasStoredCalculation(false);
        setHasHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<EstimateDraft>;
      const nextDraft: EstimateDraft = {
        material: isMaterialType(parsed.material ?? "") ? (parsed.material as MaterialType) : "ISMB",
        length: typeof parsed.length === "string" ? parsed.length : "6",
        quantity: typeof parsed.quantity === "string" ? parsed.quantity : "1",
        ratePerKg: typeof parsed.ratePerKg === "string" ? parsed.ratePerKg : String(DEFAULT_RATE),
        sectionSize: typeof parsed.sectionSize === "string" ? parsed.sectionSize : "",
        sizeSearch: typeof parsed.sizeSearch === "string" ? parsed.sizeSearch : "",
        pipeOuterDiameterMm: typeof parsed.pipeOuterDiameterMm === "string" ? parsed.pipeOuterDiameterMm : "",
        pipeInnerDiameterMm: typeof parsed.pipeInnerDiameterMm === "string" ? parsed.pipeInnerDiameterMm : "",
        plateWidthMm: typeof parsed.plateWidthMm === "string" ? parsed.plateWidthMm : "",
        plateThicknessMm: typeof parsed.plateThicknessMm === "string" ? parsed.plateThicknessMm : "",
        advancedOpen: Boolean(parsed.advancedOpen),
      };

      setMaterial(nextDraft.material);
      setLength(nextDraft.length);
      setQuantity(nextDraft.quantity);
      setRatePerKg(nextDraft.ratePerKg);
      setSectionSize(nextDraft.sectionSize);
      setSizeSearch(nextDraft.sizeSearch);
      setPipeOuterDiameterMm(nextDraft.pipeOuterDiameterMm);
      setPipeInnerDiameterMm(nextDraft.pipeInnerDiameterMm);
      setPlateWidthMm(nextDraft.plateWidthMm);
      setPlateThicknessMm(nextDraft.plateThicknessMm);
      setAdvancedOpen(nextDraft.advancedOpen);
      setHasStoredCalculation(true);
    } catch {
      setHasStoredCalculation(false);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (material === "PIPE" || material === "PLATE") {
      setSectionSize("");
      return;
    }

    if (!sections.length) {
      setSectionSize("");
      return;
    }

    const firstSection = sections[0]?.size ?? "";
    setSectionSize((current) => (sections.some((section) => section.size === current) ? current : firstSection));
  }, [material, sections]);

  useEffect(() => {
    if (!hasHydrated) return;

    const draft: EstimateDraft = {
      material,
      length,
      quantity,
      ratePerKg,
      sectionSize,
      sizeSearch,
      pipeOuterDiameterMm,
      pipeInnerDiameterMm,
      plateWidthMm,
      plateThicknessMm,
      advancedOpen,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setHasStoredCalculation(true);
    } catch {
      // Ignore storage failures and keep the page usable.
    }
  }, [
    advancedOpen,
    hasHydrated,
    length,
    material,
    plateThicknessMm,
    plateWidthMm,
    pipeInnerDiameterMm,
    pipeOuterDiameterMm,
    quantity,
    ratePerKg,
    sectionSize,
    sizeSearch,
  ]);

  const selectedSection = useMemo(() => {
    if (material === "PIPE" || material === "PLATE") return null;
    return sections.find((section) => section.size === sectionSize) ?? sections[0] ?? null;
  }, [material, sectionSize, sections]);

  const parsedLength = Number(length) || 0;
  const parsedQuantity = Math.max(1, Number(quantity) || 1);
  const parsedRate = Number(ratePerKg) || DEFAULT_RATE;

  const calculation = useMemo<CalculationResult>(() => {
    const safeLength = Number.isFinite(parsedLength) && parsedLength > 0 ? parsedLength : 0;

    if (material === "PIPE") {
      const outerDiameterMm = Number(pipeOuterDiameterMm) || 0;
      const innerDiameterMm = Number(pipeInnerDiameterMm) || 0;
      const pipeThicknessMm = outerDiameterMm && innerDiameterMm ? Math.max((outerDiameterMm - innerDiameterMm) / 2, 0) : 0;

      const result = calculateWeight("PIPE", {
        size: "Custom",
        lengthM: safeLength,
        quantity: parsedQuantity,
        outerDiameterMm,
        pipeThicknessMm,
      });

      return {
        sectionName: "Pipe",
        materialLabel: "Pipe",
        sizeLabel:
          outerDiameterMm || innerDiameterMm
            ? `${formatNumber(outerDiameterMm, 0)} OD / ${formatNumber(innerDiameterMm, 0)} ID mm`
            : "Add diameters in Advanced Options",
        weightPerMeter: result.weightPerMeter,
        totalWeightKg: result.totalWeightKg,
        totalWeightMt: result.totalWeightKg / 1000,
        estimatedCost: result.totalWeightKg * parsedRate,
      };
    }

    if (material === "PLATE") {
      const widthMm = Number(plateWidthMm) || 0;
      const thicknessMm = Number(plateThicknessMm) || 0;

      const result = calculateWeight("PLATE", {
        size: "Custom",
        lengthM: safeLength,
        quantity: parsedQuantity,
        plateLengthMm: safeLength * 1000,
        plateWidthMm: widthMm,
        thicknessMm,
      });

      return {
        sectionName: "Plate",
        materialLabel: "Plate",
        sizeLabel:
          widthMm || thicknessMm
            ? `${formatNumber(widthMm, 0)} × ${formatNumber(thicknessMm, 0)} mm`
            : "Add width and thickness in Advanced Options",
        weightPerMeter: result.weightPerMeter,
        totalWeightKg: result.totalWeightKg,
        totalWeightMt: result.totalWeightKg / 1000,
        estimatedCost: result.totalWeightKg * parsedRate,
      };
    }

    const result = calculateWeight(material, {
      size: selectedSection?.size ?? sectionSize,
      lengthM: safeLength,
      quantity: parsedQuantity,
      weightPerMeter: selectedSection?.weightPerMeter ?? 0,
    });

    return {
      sectionName: result.sectionName,
      materialLabel: material,
      sizeLabel: selectedSection?.size ?? "Choose a section size in Advanced Options",
      weightPerMeter: result.weightPerMeter,
      totalWeightKg: result.totalWeightKg,
      totalWeightMt: result.totalWeightKg / 1000,
      estimatedCost: result.totalWeightKg * parsedRate,
    };
  }, [
    material,
    parsedLength,
    parsedQuantity,
    parsedRate,
    pipeInnerDiameterMm,
    pipeOuterDiameterMm,
    plateThicknessMm,
    plateWidthMm,
    sectionSize,
    selectedSection?.size,
    selectedSection?.weightPerMeter,
  ]);

  const previewAreaSquareMeters = useMemo(() => {
    if (calculation.weightPerMeter <= 0) return 0;
    return calculation.weightPerMeter / 7850;
  }, [calculation.weightPerMeter]);

  const shapeKind = getShapeKind(material);
  const trustText = "Based on IS standard steel data and real project estimation practices";
  const valueLine = "Get steel weight & cost in 10 seconds — no manual calculation needed";
  const trustBadges: string[] = ["Based on IS standard data", "Used by engineers & contractors"];
  const whatsappHintText = "Get faster response on WhatsApp →";

  const canShowSectionPicker = material !== "PIPE" && material !== "PLATE";
  const showPipeFields = material === "PIPE";
  const showPlateFields = material === "PLATE";

  const shareMessage = useMemo(() => {
    const lines = [
      `${COMPANY_NAME} estimate`,
      "",
      `Section: ${calculation.sectionName}`,
      `Material: ${calculation.materialLabel}`,
      `Size: ${calculation.sizeLabel}`,
      `Weight: ${formatWeightKg(calculation.totalWeightKg)}`,
      `Cost: ${formatCurrency(calculation.estimatedCost)}`,
      `Length: ${formatNumber(parsedLength, 2)} m`,
      `Quantity: ${parsedQuantity}`,
    ];

    return lines.join("\n");
  }, [
    calculation.estimatedCost,
    calculation.materialLabel,
    calculation.sectionName,
    calculation.sizeLabel,
    calculation.totalWeightKg,
    parsedLength,
    parsedQuantity,
  ]);

  const pdfLines = useMemo(() => {
    return [
      COMPANY_NAME,
      `Company name: ${COMPANY_NAME}`,
      `Section: ${calculation.sectionName}`,
      `Weight: ${formatWeightKg(calculation.totalWeightKg)}`,
      `Cost: INR ${formatNumber(calculation.estimatedCost, 2)}`,
      `Material: ${calculation.materialLabel}`,
      `Size: ${calculation.sizeLabel}`,
      `Length: ${formatNumber(parsedLength, 2)} m`,
      `Quantity: ${parsedQuantity}`,
    ];
  }, [
    calculation.estimatedCost,
    calculation.materialLabel,
    calculation.sectionName,
    calculation.sizeLabel,
    calculation.totalWeightKg,
    parsedLength,
    parsedQuantity,
  ]);

  const whatsappUrl = useMemo(
    () => `https://wa.me/917738979633?text=${encodeURIComponent(shareMessage)}`,
    [shareMessage]
  );

  const handleMaterialChange = useCallback((value: MaterialType) => {
    setMaterial(value);
    setSizeSearch("");
    setAdvancedOpen(false);
  }, []);

  const handleOpenWhatsApp = useCallback(() => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }, [whatsappUrl]);

  const handleCopyResult = useCallback(async () => {
    await copyTextToClipboard(shareMessage);
  }, [shareMessage]);

  const handleResumeLastCalculation = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<EstimateDraft>;
      const nextDraft: EstimateDraft = {
        material: isMaterialType(parsed.material ?? "") ? (parsed.material as MaterialType) : "ISMB",
        length: typeof parsed.length === "string" ? parsed.length : "6",
        quantity: typeof parsed.quantity === "string" ? parsed.quantity : "1",
        ratePerKg: typeof parsed.ratePerKg === "string" ? parsed.ratePerKg : String(DEFAULT_RATE),
        sectionSize: typeof parsed.sectionSize === "string" ? parsed.sectionSize : "",
        sizeSearch: typeof parsed.sizeSearch === "string" ? parsed.sizeSearch : "",
        pipeOuterDiameterMm: typeof parsed.pipeOuterDiameterMm === "string" ? parsed.pipeOuterDiameterMm : "",
        pipeInnerDiameterMm: typeof parsed.pipeInnerDiameterMm === "string" ? parsed.pipeInnerDiameterMm : "",
        plateWidthMm: typeof parsed.plateWidthMm === "string" ? parsed.plateWidthMm : "",
        plateThicknessMm: typeof parsed.plateThicknessMm === "string" ? parsed.plateThicknessMm : "",
        advancedOpen: Boolean(parsed.advancedOpen),
      };

      setMaterial(nextDraft.material);
      setLength(nextDraft.length);
      setQuantity(nextDraft.quantity);
      setRatePerKg(nextDraft.ratePerKg);
      setSectionSize(nextDraft.sectionSize);
      setSizeSearch(nextDraft.sizeSearch);
      setPipeOuterDiameterMm(nextDraft.pipeOuterDiameterMm);
      setPipeInnerDiameterMm(nextDraft.pipeInnerDiameterMm);
      setPlateWidthMm(nextDraft.plateWidthMm);
      setPlateThicknessMm(nextDraft.plateThicknessMm);
      setAdvancedOpen(nextDraft.advancedOpen);
      setHasStoredCalculation(true);
    } catch {
      // Ignore storage or parse failures.
    }
  }, []);

  const handleExportPdf = useCallback(() => {
    const pdfBytes = buildPdfBytes(pdfLines);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const filename = `${sanitizeFileName(`${COMPANY_NAME}-${calculation.sectionName}`)}-estimate.pdf`;

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [calculation.sectionName, pdfLines]);

  const currentSections = canShowSectionPicker ? filteredSections : [];
  const sectionOptions = useMemo(() => {
    if (!canShowSectionPicker) return [];

    const currentSelected = sections.find((section) => section.size === sectionSize);
    const options = [...currentSections];

    if (currentSelected && !options.some((section) => section.size === currentSelected.size)) {
      options.unshift(currentSelected);
    }

    return options;
  }, [canShowSectionPicker, currentSections, sectionSize, sections]);

  useEffect(() => {
    if (usageTrackedRef.current) return;
    usageTrackedRef.current = true;

    const timer = window.setTimeout(() => {
      setShowWhatsappHint(true);
      trackCalculatorUsage({
        action: "estimate_view",
        source: "estimate_page",
        metadata: {
          material,
          sectionName: calculation.sectionName,
          sectionSize: calculation.sizeLabel,
          length: parsedLength,
          quantity: parsedQuantity,
          ratePerKg: parsedRate,
        },
      }).catch(() => {});
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [calculation.sectionName, calculation.sizeLabel, material, parsedLength, parsedQuantity, parsedRate]);

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
          <section className="industrial-card soft-fade-in rounded-[1.75rem] p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-3 border-b border-slate-700/60 pb-6">
              <p className="industrial-label">Instant steel calculator</p>
              <h1 className="industrial-heading text-2xl font-semibold sm:text-3xl lg:text-4xl">
                Fast, simple, conversion-focused steel estimation
              </h1>
              <p className="industrial-muted max-w-2xl text-sm sm:text-base">
                Enter only the material and length first. Keep the rest in Advanced Options when you need more control.
              </p>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
                <p className="text-sm font-semibold text-cyan-50">{valueLine}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {trustBadges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200"
                  >
                    <span aria-hidden="true" className="text-emerald-300">
                      ✔
                    </span>
                    {badge}
                  </span>
                ))}
              </div>

              {hasStoredCalculation ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-amber-100">Your last calculation is saved locally.</p>
                    <p className="mt-1 text-xs text-amber-100/70">Restore it anytime on this device.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResumeLastCalculation}
                    className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/20"
                  >
                    Resume last calculation
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Material
                </label>
                <select
                  value={material}
                  onChange={(e) => handleMaterialChange(e.target.value as MaterialType)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-4 text-base font-medium text-slate-100 outline-none transition focus:border-cyan-400"
                >
                  {MATERIAL_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">{getMaterialOption(material).hint}</p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Length
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-4">
                  <input
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="w-full bg-transparent text-base font-semibold text-slate-100 outline-none"
                    placeholder="6"
                  />
                  <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    m
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setAdvancedOpen((current) => !current)}
                className="btn-secondary rounded-2xl px-5 py-3 text-sm sm:text-base"
              >
                {advancedOpen ? "Hide Advanced Options" : "Advanced Options"}
              </button>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Result updates instantly
              </span>
            </div>

            <div
              className={`grid transition-all duration-300 ease-out ${
                advancedOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="rounded-[1.5rem] border border-slate-700/60 bg-slate-950/55 p-4 sm:p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Quantity
                      </label>
                      <input
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Price / Kg
                      </label>
                      <input
                        value={ratePerKg}
                        onChange={(e) => setRatePerKg(e.target.value)}
                        type="number"
                        min="0"
                        step="0.5"
                        inputMode="decimal"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {canShowSectionPicker ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.2fr]">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Search section size
                        </label>
                        <input
                          value={sizeSearch}
                          onChange={(e) => setSizeSearch(e.target.value)}
                          type="search"
                          placeholder="Search by size"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Section size
                        </label>
                        <select
                          value={sectionSize}
                          onChange={(e) => setSectionSize(e.target.value)}
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400"
                          disabled={!sectionOptions.length}
                        >
                          {sectionOptions.length ? (
                            sectionOptions.map((section) => (
                              <option key={section.size} value={section.size}>
                                {section.size}
                              </option>
                            ))
                          ) : (
                            <option value="">No matching sizes</option>
                          )}
                        </select>
                      </div>
                    </div>
                  ) : null}

                  {showPipeFields ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Outer Diameter (mm)
                        </label>
                        <input
                          value={pipeOuterDiameterMm}
                          onChange={(e) => setPipeOuterDiameterMm(e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Inner Diameter (mm)
                        </label>
                        <input
                          value={pipeInnerDiameterMm}
                          onChange={(e) => setPipeInnerDiameterMm(e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  ) : null}

                  {showPlateFields ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Width (mm)
                        </label>
                        <input
                          value={plateWidthMm}
                          onChange={(e) => setPlateWidthMm(e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Thickness (mm)
                        </label>
                        <input
                          value={plateThicknessMm}
                          onChange={(e) => setPlateThicknessMm(e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-[1.5rem] border border-slate-700/60 bg-slate-950/55 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="industrial-label">Shape preview</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-100">{calculation.sectionName}</h2>
                  </div>
                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                    {material}
                  </span>
                </div>

                <ShapePreview
                  shape={shapeKind}
                  lengthMeters={parsedLength || 0}
                  areaSquareMeters={previewAreaSquareMeters}
                  className="soft-float"
                />
              </div>

              <div className="rounded-[1.5rem] border border-slate-700/60 bg-slate-950/55 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="industrial-label">Section details</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-100">Active selection</h2>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Live
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricPill label="Material" value={calculation.materialLabel} />
                  <MetricPill label="Size" value={calculation.sizeLabel} />
                  <MetricPill label="Weight / m" value={formatWeightKg(calculation.weightPerMeter)} />
                  <MetricPill label="Quantity" value={`${parsedQuantity}`} />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
                  <p className="industrial-label">Trust note</p>
                  <p className="mt-2 text-sm text-slate-300">{trustText}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="sticky top-4 self-start rounded-[1.75rem] border border-slate-700/60 bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/30 sm:p-6 lg:top-6">
            <p className="industrial-label">Result</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Instant estimate</h2>
            <p className="mt-2 text-sm text-slate-400">Weight and cost are recalculated as you type.</p>

            <div className="mt-6 space-y-4">
              <div className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Total weight</p>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {formatNumber(calculation.totalWeightKg, 3)}
                </div>
                <div className="mt-2 text-sm text-cyan-100/90">{formatWeightMt(calculation.totalWeightKg)}</div>
              </div>

              <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">Estimated cost</p>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {formatCurrency(calculation.estimatedCost)}
                </div>
                <div className="mt-2 text-sm text-emerald-100/90">At {formatCurrency(parsedRate)} per kg</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetricPill label="Weight / m" value={formatWeightKg(calculation.weightPerMeter)} />
                <MetricPill label="Length" value={`${formatNumber(parsedLength, 2)} m`} />
              </div>

              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 text-sm text-slate-300">
                <p className="font-medium text-slate-100">Why this feels instant</p>
                <ul className="mt-2 space-y-1 text-slate-400">
                  <li>• Main inputs stay simple</li>
                  <li>• Advanced inputs stay hidden until needed</li>
                  <li>• Search is debounced for smoother updates</li>
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="btn-secondary rounded-2xl px-5 py-4 text-base font-semibold"
                >
                  Copy result
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="btn-primary rounded-2xl px-5 py-4 text-base font-semibold shadow-lg shadow-sky-950/30"
                >
                  Share via WhatsApp
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportPdf}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-4 text-base font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-900"
              >
                Export PDF
              </button>

              <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  Need exact quotation for your project?
                </p>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="mt-3 w-full rounded-2xl bg-emerald-400 px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Get detailed estimate
                </button>
                <p className="mt-3 text-sm text-emerald-100/90">
                  {showWhatsappHint ? whatsappHintText : "WhatsApp response is usually faster than email."}
                </p>
              </div>

              <p className="text-center text-xs text-slate-500">{trustText}</p>
            </div>
          </aside>
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-fab rounded-full animate-pulse"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <span className="sr-only">Chat on WhatsApp</span>
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true">
          <path d="M19.11 17.2c-.28-.14-1.65-.82-1.9-.91-.25-.09-.44-.14-.63.14-.19.28-.72.91-.88 1.1-.16.19-.32.21-.59.07-.28-.14-1.17-.43-2.23-1.37-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.52-.86-2.08-.23-.55-.46-.48-.63-.49-.16-.01-.35-.01-.54-.01-.19 0-.49.07-.74.35-.25.28-.96.94-.96 2.29s.98 2.65 1.12 2.84c.14.19 1.95 2.98 4.72 4.17.66.28 1.17.45 1.57.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.89-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32zM16.02 3.2c-6.98 0-12.64 5.66-12.64 12.64 0 2.24.59 4.42 1.71 6.33L3.1 28.8l6.78-1.78a12.59 12.59 0 0 0 6.14 1.58h.01c6.98 0 12.64-5.66 12.64-12.64S23 3.2 16.02 3.2zm0 22.98h-.01c-1.98 0-3.92-.53-5.62-1.53l-.4-.24-4.02 1.05 1.07-3.92-.26-.41a10.54 10.54 0 0 1-1.62-5.61c0-5.83 4.74-10.57 10.57-10.57S26.6 10.5 26.6 16.33s-4.75 9.85-10.58 9.85z" />
        </svg>
      </a>
    </main>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
