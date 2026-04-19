export type MaterialType = 'round-bar' | 'flat-bar' | 'plate' | 'square-bar' | 'pipe';

export type CalculatorMode = 'single' | 'multiple';

export interface WeightCalculatorInput {
  materialType: MaterialType;
  mode: CalculatorMode;
  quantity: number;
  density: number;
  diameterMm?: number;
  widthMm?: number;
  thicknessMm?: number;
  sideMm?: number;
  outerDiameterMm?: number;
  innerDiameterMm?: number;
  lengthMm?: number;
  lengthM?: number;
  widthM?: number;
  heightMm?: number;
  thicknessM?: number;
}

export interface WeightCalculatorResult {
  weightKg: number;
  unitWeightKg: number;
  volumeM3: number;
}

const DEFAULT_DENSITY = 7850;
const MM_TO_M = 0.001;
const PI = Math.PI;

function round(value: number, precision = 3): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function ensurePositive(value: number | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function calculateWeight(input: WeightCalculatorInput): WeightCalculatorResult {
  const density = ensurePositive(input.density, DEFAULT_DENSITY);
  const quantity = Math.max(1, Math.floor(ensurePositive(input.quantity, 1)));

  let volumeM3 = 0;

  switch (input.materialType) {
    case 'round-bar': {
      const diameterM = ensurePositive(input.diameterMm) * MM_TO_M;
      const lengthM = ensurePositive(input.lengthM, ensurePositive(input.lengthMm) * MM_TO_M);
      const radiusM = diameterM / 2;
      volumeM3 = PI * radiusM * radiusM * lengthM;
      break;
    }
    case 'flat-bar': {
      const widthM = ensurePositive(input.widthMm) * MM_TO_M;
      const thicknessM = ensurePositive(input.thicknessMm) * MM_TO_M;
      const lengthM = ensurePositive(input.lengthM, ensurePositive(input.lengthMm) * MM_TO_M);
      volumeM3 = widthM * thicknessM * lengthM;
      break;
    }
    case 'plate': {
      const lengthM = ensurePositive(input.lengthM, ensurePositive(input.lengthMm) * MM_TO_M);
      const widthM = ensurePositive(input.widthM, ensurePositive(input.widthMm) * MM_TO_M);
      const thicknessM = ensurePositive(input.thicknessM, ensurePositive(input.thicknessMm) * MM_TO_M);
      volumeM3 = lengthM * widthM * thicknessM;
      break;
    }
    case 'square-bar': {
      const sideM = ensurePositive(input.sideMm) * MM_TO_M;
      const lengthM = ensurePositive(input.lengthM, ensurePositive(input.lengthMm) * MM_TO_M);
      volumeM3 = sideM * sideM * lengthM;
      break;
    }
    case 'pipe': {
      const outerDiameterM = ensurePositive(input.outerDiameterMm) * MM_TO_M;
      const innerDiameterM = ensurePositive(input.innerDiameterMm) * MM_TO_M;
      const lengthM = ensurePositive(input.lengthM, ensurePositive(input.lengthMm) * MM_TO_M);
      const outerRadiusM = outerDiameterM / 2;
      const innerRadiusM = innerDiameterM / 2;
      volumeM3 = PI * (outerRadiusM * outerRadiusM - innerRadiusM * innerRadiusM) * lengthM;
      break;
    }
    default:
      volumeM3 = 0;
  }

  const unitWeightKg = volumeM3 * density;
  const weightKg = unitWeightKg * quantity;

  return {
    weightKg: round(weightKg),
    unitWeightKg: round(unitWeightKg),
    volumeM3: round(volumeM3, 6),
  };
}

export function formatKg(value: number): string {
  return `${round(value)} kg`;
}

export function getMaterialLabel(materialType: MaterialType): string {
  switch (materialType) {
    case 'round-bar':
      return 'Round Bar';
    case 'flat-bar':
      return 'Flat Bar';
    case 'plate':
      return 'Plate';
    case 'square-bar':
      return 'Square Bar';
    case 'pipe':
      return 'Pipe';
    default:
      return 'Material';
  }
}

export function getMaterialDescription(materialType: MaterialType): string {
  switch (materialType) {
    case 'round-bar':
      return 'Solid cylindrical section';
    case 'flat-bar':
      return 'Rectangular strip section';
    case 'plate':
      return 'Sheet or plate section';
    case 'square-bar':
      return 'Solid square section';
    case 'pipe':
      return 'Hollow circular section';
    default:
      return '';
  }
}