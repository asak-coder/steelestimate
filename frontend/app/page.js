"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSections } from "../lib/api";
import {
  AREA_UNITS,
  LENGTH_UNITS,
  convertAreaFromSquareMeters,
  convertLengthFromMeters,
  formatAreaValue,
  formatLengthValue,
  normalizeLengthToMeters,
} from "../lib/converter";

const ShapePreview = dynamic(() => import("../components/ShapePreview"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[360px] items-center justify-center rounded-[1.5rem] border border-slate-800 bg-slate-950/70">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500/40 border-t-sky-400" />
    </div>
  ),
});

const STEEL_DENSITY_KG_M3 = 7850;

const MATERIALS = [
  { id: "mild-steel", label: "Mild Steel", ratePerKg: 62 },
  { id: "structural-steel", label: "Structural Steel", ratePerKg: 74 },
  { id: "stainless-steel", label: "Stainless Steel", ratePerKg: 220 },
];

const SECTION_CATEGORIES = [
  { id: "ISMB", label: "ISMB" },
  { id: "ISMC", label: "ISMC" },
  { id: "ISA", label: "ISA" },
];

const VISUAL_SHAPES = [
  { id: "ismb", label: "I-beam" },
  { id: "pipe", label: "Pipe" },
  { id: "plate", label: "Plate" },
];

const AREA_SHAPES = [
  { id: "rectangle", label: "Rectangle" },
  { id: "circle", label: "Circle" },
  { id: "triangle", label: "Triangle" },
];

const AREA_HELPER_DEFAULTS = {
  rectangle: { width: 200, height: 120 },
  circle: { radius: 90 },
  triangle: { base: 240, height: 150 },
};

const DEFAULT_LENGTH = 6;
const DEFAULT_QUANTITY = 1;

const formatNumber = (value, fractionDigits = 2) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(value) ? value : 0);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const toFiniteNumber = (value) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toSectionId = (section) => String(section?.id ?? section?._id ?? section?.designation ?? "");

function useDebouncedValue(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

function calculateRectangleArea(widthMeters, heightMeters) {
  return Math.max(0, widthMeters) * Math.max(0, heightMeters);
}

function calculateCircleArea(radiusMeters) {
  return Math.PI * Math.max(0, radiusMeters) * Math.max(0, radiusMeters);
}

function calculateTriangleArea(baseMeters, heightMeters) {
  return (Math.max(0, baseMeters) * Math.max(0, heightMeters)) / 2;
}

function getAreaInputs(areaShape, values) {
  if (areaShape === "circle") {
    return {
      primaryLabel: "Radius",
      primaryValue: values.radius,
      secondaryLabel: "",
      secondaryValue: 0,
    };
  }

  if (areaShape === "triangle") {
    return {
      primaryLabel: "Base",
      primaryValue: values.base,
      secondaryLabel: "Height",
      secondaryValue: values.height,
    };
  }

  return {
    primaryLabel: "Width",
    primaryValue: values.width,
    secondaryLabel: "Height",
    secondaryValue: values.height,
  };
}

function getVisibleAreaDescription(areaShape) {
  if (areaShape === "circle") {
    return "Round profile area is calculated internally and shown below.";
  }

  if (areaShape === "triangle") {
    return "Triangular area is calculated internally and shown below.";
  }

  return "Rectangular area is calculated internally and shown below.";
}

export default function HomePage() {
  const [sectionCategory, setSectionCategory] = useState("ISMB");
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [materialId, setMaterialId] = useState("mild-steel");
  const [lengthValue, setLengthValue] = useState(DEFAULT_LENGTH);
  const [lengthUnit, setLengthUnit] = useState("m");
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [visualShape, setVisualShape] = useState("ismb");

  const [areaShape, setAreaShape] = useState("rectangle");
  const [areaUnit, setAreaUnit] = useState("m");
  const [areaValues, setAreaValues] = useState({
    width: AREA_HELPER_DEFAULTS.rectangle.width,
    height: AREA_HELPER_DEFAULTS.rectangle.height,
    radius: AREA_HELPER_DEFAULTS.circle.radius,
    base: AREA_HELPER_DEFAULTS.triangle.base,
  });

  const debouncedSearch = useDebouncedValue(searchQuery.trim().toLowerCase(), 220);

  useEffect(() => {
    let active = true;

    async function loadSections() {
      setSectionsLoading(true);
      setSectionsError("");

      try {
        const data = await getSections(sectionCategory);
        if (!active) return;

        setSections(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!active) return;
        setSections([]);
        setSectionsError(error?.message || "Unable to load steel sections");
      } finally {
        if (active) {
          setSectionsLoading(false);
        }
      }
    }

    loadSections();

    return () => {
      active = false;
    };
  }, [sectionCategory]);

  const filteredSections = useMemo(() => {
    if (!debouncedSearch) {
      return sections.slice(0, 24);
    }

    return sections.filter((section) => {
      const designation = String(section?.designation ?? "").toLowerCase();
      const category = String(section?.category ?? "").toLowerCase();
      const weight = String(section?.weightPerMeter ?? "");
      return (
        designation.includes(debouncedSearch) ||
        category.includes(debouncedSearch) ||
        weight.includes(debouncedSearch)
      );
    });
  }, [debouncedSearch, sections]);

  useEffect(() => {
    if (!filteredSections.length) {
      setSelectedSectionId("");
      return;
    }

    const stillVisible = filteredSections.some((section) => toSectionId(section) === selectedSectionId);
    if (!selectedSectionId || !stillVisible) {
      setSelectedSectionId(toSectionId(filteredSections[0]));
    }
  }, [filteredSections, selectedSectionId]);

  const selectedSection = useMemo(() => {
    return filteredSections.find((section) => toSectionId(section) === selectedSectionId) || filteredSections[0] || null;
  }, [filteredSections, selectedSectionId]);

  const activeMaterial = useMemo(
    () => MATERIALS.find((item) => item.id === materialId) || MATERIALS[0],
    [materialId]
  );

  const lengthMeters = useMemo(
    () => normalizeLengthToMeters(lengthValue, lengthUnit),
    [lengthValue, lengthUnit]
  );

  const quantityValue = Math.max(1, Math.round(toFiniteNumber(quantity)));
  const sectionWeightPerMeter = toFiniteNumber(selectedSection?.weightPerMeter);
  const weightKg = sectionWeightPerMeter * lengthMeters * quantityValue;
  const weightTonnes = weightKg / 1000;
  const weightLb = weightKg * 2.2046226218;
  const cost = weightKg * activeMaterial.ratePerKg;
  const sectionAreaSquareMeters = sectionWeightPerMeter > 0 ? sectionWeightPerMeter / STEEL_DENSITY_KG_M3 : 0;

  const lengthConversions = useMemo(() => {
    const baseLength = lengthMeters;
    return {
      mm: convertLengthFromMeters(baseLength, "mm"),
      cm: convertLengthFromMeters(baseLength, "cm"),
      m: convertLengthFromMeters(baseLength, "m"),
      ft: convertLengthFromMeters(baseLength, "ft"),
    };
  }, [lengthMeters]);

  const whatsappMessage = useMemo(() => {
    const sectionLabel = selectedSection
      ? `${selectedSection.category} ${selectedSection.designation}`
      : "Steel estimate";
    const lines = [
      "SteelEstimate instant quote request",
      `Section: ${sectionLabel}`,
      `Length: ${formatNumber(lengthMeters, 2)} m`,
      `Quantity: ${quantityValue}`,
      `Weight: ${formatNumber(weightKg, 2)} kg`,
      `Cost: ${formatCurrency(cost)}`,
    ];

    return encodeURIComponent(lines.join("\n"));
  }, [cost, lengthMeters, quantityValue, selectedSection, weightKg]);

  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
  const boqUrl = `/dashboard/boq?section=${encodeURIComponent(toSectionId(selectedSection))}&length=${encodeURIComponent(
    String(lengthMeters)
  )}&quantity=${encodeURIComponent(String(quantityValue))}&material=${encodeURIComponent(materialId)}`;

  const areaInputs = getAreaInputs(areaShape, areaValues);
  const areaUnitLengthMeters = normalizeLengthToMeters(1, areaUnit);
  const areaPrimaryMeters = normalizeLengthToMeters(areaInputs.primaryValue, areaUnit);
  const areaSecondaryMeters = normalizeLengthToMeters(areaInputs.secondaryValue, areaUnit);

  const areaSquareMeters = useMemo(() => {
    if (areaShape === "circle") {
      return calculateCircleArea(areaPrimaryMeters);
    }

    if (areaShape === "triangle") {
      return calculateTriangleArea(areaPrimaryMeters, areaSecondaryMeters);
    }

    return calculateRectangleArea(areaPrimaryMeters, areaSecondaryMeters);
  }, [areaPrimaryMeters, areaSecondaryMeters, areaShape]);

  const areaSquareFeet = convertAreaFromSquareMeters(areaSquareMeters, "sqft");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_24%),var(--background)] text-slate-100">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <header className="industrial-card rounded-[2rem] p-6 sm:p-8 soft-fade-in">
              <div className="inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Calculator-first steel estimation
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Steel Estimation Made Simple
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Instantly calculate weight, cost, and BOQ for steel structures with a fast public calculator built for mobile and desktop.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2">
                  Live calculations
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2">
                  Section search
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2">
                  WhatsApp-ready quote
                </span>
              </div>
            </header>

            <section className="industrial-card rounded-[2rem] p-6 sm:p-8 soft-fade-in">
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="industrial-label">Primary calculator</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Shape, section, length, quantity</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {LENGTH_UNITS.map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setLengthUnit(unit)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] transition ${
                        lengthUnit === unit
                          ? "border-sky-400/40 bg-sky-500 text-white shadow-lg shadow-sky-950/20"
                          : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Shape visual</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {VISUAL_SHAPES.map((shape) => {
                        const active = visualShape === shape.id;
                        return (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => setVisualShape(shape.id)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              active
                                ? "border-cyan-500/40 bg-cyan-500/10 text-white shadow-lg shadow-cyan-950/10"
                                : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600 hover:bg-slate-900/70"
                            }`}
                          >
                            <span className="block text-sm font-semibold">{shape.label}</span>
                            <span className="mt-1 block text-xs text-slate-400">Live preview</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Section catalog</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {SECTION_CATEGORIES.map((category) => {
                        const active = sectionCategory === category.id;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setSectionCategory(category.id)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              active
                                ? "border-sky-500/40 bg-sky-500/10 text-white shadow-lg shadow-sky-950/10"
                                : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600 hover:bg-slate-900/70"
                            }`}
                          >
                            <span className="block text-sm font-semibold">{category.label}</span>
                            <span className="mt-1 block text-xs text-slate-400">
                              {sectionsLoading ? "Loading..." : `${filteredSections.length} sections`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Search sections
                    </span>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by designation or weight"
                      className="mt-3 w-full bg-transparent text-lg font-medium text-white outline-none placeholder:text-slate-500"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Length
                      </span>
                      <div className="mt-3 flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={lengthValue}
                          onChange={(event) => setLengthValue(event.target.value)}
                          className="w-full bg-transparent text-2xl font-semibold tracking-tight text-white outline-none placeholder:text-slate-500"
                        />
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {lengthUnit}
                        </span>
                      </div>
                    </label>

                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Quantity
                      </span>
                      <div className="mt-3 flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={quantity}
                          onChange={(event) => setQuantity(event.target.value)}
                          className="w-full bg-transparent text-2xl font-semibold tracking-tight text-white outline-none placeholder:text-slate-500"
                        />
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          pcs
                        </span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Material</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {MATERIALS.map((material) => {
                        const active = material.id === materialId;
                        return (
                          <button
                            key={material.id}
                            type="button"
                            onClick={() => setMaterialId(material.id)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              active
                                ? "border-emerald-500/40 bg-emerald-500/10 text-white shadow-lg shadow-emerald-950/10"
                                : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600 hover:bg-slate-900/70"
                            }`}
                          >
                            <span className="block text-sm font-semibold">{material.label}</span>
                            <span className="mt-1 block text-xs text-slate-400">
                              {formatCurrency(material.ratePerKg)} / kg
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="industrial-label">Selected section</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">
                          {selectedSection ? `${selectedSection.category} ${selectedSection.designation}` : "No section selected"}
                        </h3>
                      </div>
                      <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {sectionsLoading ? "Loading" : `${filteredSections.length} results`}
                      </span>
                    </div>

                    {sectionsError ? (
                      <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        {sectionsError}
                      </div>
                    ) : null}

                    <div className="mt-4 max-h-[18rem] space-y-3 overflow-auto pr-1">
                      {sectionsLoading ? (
                        <SectionSkeletonList />
                      ) : filteredSections.length ? (
                        filteredSections.map((section) => {
                          const active = toSectionId(section) === selectedSectionId;
                          return (
                            <button
                              key={toSectionId(section)}
                              type="button"
                              onClick={() => setSelectedSectionId(toSectionId(section))}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                active
                                  ? "border-sky-500/40 bg-sky-500/10 shadow-lg shadow-sky-950/10"
                                  : "border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/70"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold text-white">{section.designation}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                                    {section.category}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-white">
                                    {formatNumber(toFiniteNumber(section.weightPerMeter), 2)} kg/m
                                  </p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                                    Weight per meter
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-8 text-center text-sm text-slate-400">
                          No sections matched your search.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ResultCard
                      label="Weight"
                      value={`${formatNumber(weightKg, 2)} kg`}
                      subtext={`${formatNumber(weightTonnes, 4)} MT`}
                    />
                    <ResultCard
                      label="Cost"
                      value={formatCurrency(cost)}
                      subtext={`${formatNumber(activeMaterial.ratePerKg, 0)} / kg`}
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="industrial-label">Converted values</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">Length and weight conversions</h3>
                      </div>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                        Live
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <ConversionItem label="Length (mm)" value={formatNumber(lengthConversions.mm, 2)} />
                      <ConversionItem label="Length (cm)" value={formatNumber(lengthConversions.cm, 2)} />
                      <ConversionItem label="Length (m)" value={formatNumber(lengthConversions.m, 2)} />
                      <ConversionItem label="Length (ft)" value={formatNumber(lengthConversions.ft, 2)} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <ConversionItem label="Kilograms" value={`${formatNumber(weightKg, 2)} kg`} />
                      <ConversionItem label="Tonnes" value={`${formatNumber(weightTonnes, 4)} MT`} />
                      <ConversionItem label="Pounds" value={`${formatNumber(weightLb, 2)} lb`} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary rounded-full"
                    >
                      Get Instant Quote on WhatsApp
                    </a>
                    <Link href={boqUrl} className="btn-secondary rounded-full">
                      Generate Detailed BOQ
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="industrial-card rounded-[2rem] p-6 sm:p-8 soft-fade-in">
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="industrial-label">Visual preview</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Dynamic shape rendering</h2>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {VISUAL_SHAPES.find((item) => item.id === visualShape)?.label}
                </span>
              </div>

              <div className="mt-6">
                <ShapePreview
                  shape={visualShape}
                  lengthMeters={lengthMeters}
                  areaSquareMeters={sectionAreaSquareMeters}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <PreviewChip label="Length" value={formatLengthValue(lengthMeters, "m", 2)} />
                <PreviewChip label="Section area" value={formatAreaValue(sectionAreaSquareMeters, "sqm", 6)} />
                <PreviewChip label="Material" value={activeMaterial.label} />
              </div>
            </section>

            <section className="industrial-card rounded-[2rem] p-6 sm:p-8 soft-fade-in">
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="industrial-label">Area helper</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Rectangle, circle, triangle</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AREA_SHAPES.map((shape) => {
                    const active = areaShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setAreaShape(shape.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] transition ${
                          active
                            ? "border-cyan-400/40 bg-cyan-500 text-white shadow-lg shadow-cyan-950/20"
                            : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                        }`}
                      >
                        {shape.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">{getVisibleAreaDescription(areaShape)}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {LENGTH_UNITS.map((unit) => {
                  const active = areaUnit === unit;
                  return (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setAreaUnit(unit)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        active
                          ? "border-sky-400/40 bg-sky-500 text-white shadow-lg shadow-sky-950/20"
                          : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                      }`}
                    >
                      {unit}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4">
                {areaShape === "circle" ? (
                  <AreaInput
                    label="Radius"
                    unit={areaUnit}
                    value={areaValues.radius / areaUnitLengthMeters}
                    onChange={(value) =>
                      setAreaValues((current) => ({ ...current, radius: normalizeLengthToMeters(value, areaUnit) }))
                    }
                  />
                ) : areaShape === "triangle" ? (
                  <>
                    <AreaInput
                      label="Base"
                      unit={areaUnit}
                      value={areaValues.base / areaUnitLengthMeters}
                      onChange={(value) =>
                        setAreaValues((current) => ({ ...current, base: normalizeLengthToMeters(value, areaUnit) }))
                      }
                    />
                    <AreaInput
                      label="Height"
                      unit={areaUnit}
                      value={areaValues.height / areaUnitLengthMeters}
                      onChange={(value) =>
                        setAreaValues((current) => ({ ...current, height: normalizeLengthToMeters(value, areaUnit) }))
                      }
                    />
                  </>
                ) : (
                  <>
                    <AreaInput
                      label="Width"
                      unit={areaUnit}
                      value={areaValues.width / areaUnitLengthMeters}
                      onChange={(value) =>
                        setAreaValues((current) => ({ ...current, width: normalizeLengthToMeters(value, areaUnit) }))
                      }
                    />
                    <AreaInput
                      label="Height"
                      unit={areaUnit}
                      value={areaValues.height / areaUnitLengthMeters}
                      onChange={(value) =>
                        setAreaValues((current) => ({ ...current, height: normalizeLengthToMeters(value, areaUnit) }))
                      }
                    />
                  </>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ResultCard
                  label="Area"
                  value={formatAreaValue(areaSquareMeters, "sqm", 6)}
                  subtext={`${formatNumber(areaSquareFeet, 2)} sqft`}
                />
                <ResultCard
                  label="Area converted"
                  value={`${formatNumber(convertAreaFromSquareMeters(areaSquareMeters, "sqm"), 6)} sqm`}
                  subtext="Computed internally"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                <p className="text-sm font-semibold text-sky-100">Internal calculation only</p>
                <p className="mt-1 text-sm leading-6 text-slate-200">
                  The helper calculates shape area without exposing formulas, then converts the result into square meters and square feet.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function PreviewChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function ResultCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{subtext}</p>
    </div>
  );
}

function ConversionItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function SectionSkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
        >
          <div className="h-4 w-1/3 rounded bg-slate-800" />
          <div className="mt-3 h-3 w-1/4 rounded bg-slate-800" />
          <div className="mt-4 h-3 w-1/5 rounded bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function AreaInput({ label, unit, value, onChange }) {
  return (
    <label className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="number"
          min="0"
          step="0.1"
          value={Number.isFinite(toFiniteNumber(value)) ? value : 0}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-2xl font-semibold tracking-tight text-white outline-none placeholder:text-slate-500"
        />
        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {unit}
        </span>
      </div>
    </label>
  );
}
