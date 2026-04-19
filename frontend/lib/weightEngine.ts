export type MsSectionType = "ISMB" | "ISMC" | "ISA" | "PLATE" | "PIPE" | "ANGLE";

export type MsWeightInputs = {
  size?: string;
  lengthM?: number;
  quantity?: number;
  weightPerMeter?: number;
  plateLengthMm?: number;
  plateWidthMm?: number;
  thicknessMm?: number;
  outerDiameterMm?: number;
  pipeThicknessMm?: number;
};

export type MsWeightResult = {
  materialType: MsSectionType;
  sectionName: string;
  weightPerMeter: number;
  weightPerItemKg: number;
  totalWeightKg: number;
  totalWeightMt: number;
};

export type MsWeightItem = MsWeightInputs & {
  materialType: MsSectionType;
};

export type MsWeightSummary = {
  items: MsWeightResult[];
  totalWeightKg: number;
  totalWeightMt: number;
};

const DEFAULT_QUANTITY = 1;
const STEEL_DENSITY_FACTOR = 7.85;

function toPositiveNumber(value: unknown, fallback = 0): number {
  const num = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function cleanSize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatSectionName(type: MsSectionType, size?: string): string {
  return size ? `${type} ${size}` : type;
}

function calculatePlateWeightKg(inputs: MsWeightInputs): number {
  const lengthMm = toPositiveNumber(inputs.plateLengthMm, 0);
  const widthMm = toPositiveNumber(inputs.plateWidthMm, 0);
  const thicknessMm = toPositiveNumber(inputs.thicknessMm, 0);

  return (lengthMm * widthMm * thicknessMm * STEEL_DENSITY_FACTOR) / 1_000_000;
}

function calculatePipeWeightPerMeterKg(inputs: MsWeightInputs): number {
  const outerDiameterMm = toPositiveNumber(inputs.outerDiameterMm, 0);
  const thicknessMm = toPositiveNumber(inputs.pipeThicknessMm ?? inputs.thicknessMm, 0);

  if (!outerDiameterMm || !thicknessMm) {
    return 0;
  }

  const innerDiameterMm = Math.max(outerDiameterMm - 2 * thicknessMm, 0);
  return 0.02466 * (outerDiameterMm - thicknessMm) * thicknessMm;
}

function calculateSectionWeightPerItemKg(inputs: MsWeightInputs): number {
  const lengthM = toPositiveNumber(inputs.lengthM, 0);
  const weightPerMeter = toPositiveNumber(inputs.weightPerMeter, 0);
  return weightPerMeter * lengthM;
}

export function calculateWeight(type: MsSectionType, inputs: MsWeightInputs): MsWeightResult {
  const size = cleanSize(inputs.size);
  const quantity = Math.max(1, Math.floor(toPositiveNumber(inputs.quantity, DEFAULT_QUANTITY)));

  let weightPerMeter = 0;
  let weightPerItemKg = 0;

  switch (type) {
    case "PLATE": {
      weightPerItemKg = calculatePlateWeightKg(inputs);
      break;
    }
    case "PIPE": {
      weightPerMeter = calculatePipeWeightPerMeterKg(inputs);
      weightPerItemKg = weightPerMeter * toPositiveNumber(inputs.lengthM, 0);
      break;
    }
    case "ISMB":
    case "ISMC":
    case "ISA":
    case "ANGLE": {
      weightPerMeter = toPositiveNumber(inputs.weightPerMeter, 0);
      weightPerItemKg = calculateSectionWeightPerItemKg(inputs);
      break;
    }
    default: {
      weightPerMeter = toPositiveNumber(inputs.weightPerMeter, 0);
      weightPerItemKg = calculateSectionWeightPerItemKg(inputs);
      break;
    }
  }

  const totalWeightKg = weightPerItemKg * quantity;

  return {
    materialType: type,
    sectionName: formatSectionName(type, size),
    weightPerMeter,
    weightPerItemKg,
    totalWeightKg,
    totalWeightMt: totalWeightKg / 1000,
  };
}

export function calculateMultiItemWeight(items: MsWeightItem[]): MsWeightSummary {
  const results = items.map((item) => calculateWeight(item.materialType, item));
  const totalWeightKg = results.reduce((sum, item) => sum + item.totalWeightKg, 0);

  return {
    items: results,
    totalWeightKg,
    totalWeightMt: totalWeightKg / 1000,
  };
}
