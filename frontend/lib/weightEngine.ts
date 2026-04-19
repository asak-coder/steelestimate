export type MsSectionType = "ISMB" | "ISMC" | "ISA";

export type MsWeightInputs = {
  size?: string;
  lengthM: number;
  quantity?: number;
  weightPerMeter?: number;
};

export type MsWeightResult = {
  sectionName: string;
  weightPerMeter: number;
  totalWeightKg: number;
};

const DEFAULT_QUANTITY = 1;

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

export function calculateWeight(type: MsSectionType, inputs: MsWeightInputs): MsWeightResult {
  const size = cleanSize(inputs.size);
  const lengthM = toPositiveNumber(inputs.lengthM, 0);
  const quantity = Math.max(1, Math.floor(toPositiveNumber(inputs.quantity, DEFAULT_QUANTITY)));
  const weightPerMeter = toPositiveNumber(inputs.weightPerMeter, 0);
  const totalWeightKg = weightPerMeter * lengthM * quantity;

  return {
    sectionName: formatSectionName(type, size),
    weightPerMeter,
    totalWeightKg,
  };
}