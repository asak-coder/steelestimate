export const LENGTH_UNITS = ['mm', 'cm', 'm', 'ft'] as const;
export const AREA_UNITS = ['sqm', 'sqft'] as const;

export type LengthUnit = (typeof LENGTH_UNITS)[number];
export type AreaUnit = (typeof AREA_UNITS)[number];

const MILLIMETERS_PER_CENTIMETER = 10;
const MILLIMETERS_PER_METER = 1000;
const MILLIMETERS_PER_FOOT = 304.8;

const SQUARE_FEET_PER_SQUARE_METER = 10.76391041671;

function toFiniteNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeLengthToMeters(value: unknown, unit: LengthUnit = 'm'): number {
  const numericValue = toFiniteNumber(value);

  switch (unit) {
    case 'mm':
      return numericValue / MILLIMETERS_PER_METER;
    case 'cm':
      return numericValue / MILLIMETERS_PER_CENTIMETER / MILLIMETERS_PER_METER;
    case 'ft':
      return numericValue * (MILLIMETERS_PER_FOOT / MILLIMETERS_PER_METER);
    case 'm':
    default:
      return numericValue;
  }
}

export function convertLengthFromMeters(valueInMeters: unknown, unit: LengthUnit = 'm'): number {
  const meters = toFiniteNumber(valueInMeters);

  switch (unit) {
    case 'mm':
      return meters * MILLIMETERS_PER_METER;
    case 'cm':
      return meters * MILLIMETERS_PER_METER / MILLIMETERS_PER_CENTIMETER;
    case 'ft':
      return meters / (MILLIMETERS_PER_FOOT / MILLIMETERS_PER_METER);
    case 'm':
    default:
      return meters;
  }
}

export function convertLength(value: unknown, fromUnit: LengthUnit, toUnit: LengthUnit): number {
  return convertLengthFromMeters(normalizeLengthToMeters(value, fromUnit), toUnit);
}

export function normalizeAreaToSquareMeters(value: unknown, unit: AreaUnit = 'sqm'): number {
  const numericValue = toFiniteNumber(value);

  switch (unit) {
    case 'sqft':
      return numericValue / SQUARE_FEET_PER_SQUARE_METER;
    case 'sqm':
    default:
      return numericValue;
  }
}

export function convertAreaFromSquareMeters(valueInSquareMeters: unknown, unit: AreaUnit = 'sqm'): number {
  const squareMeters = toFiniteNumber(valueInSquareMeters);

  switch (unit) {
    case 'sqft':
      return squareMeters * SQUARE_FEET_PER_SQUARE_METER;
    case 'sqm':
    default:
      return squareMeters;
  }
}

export function convertArea(value: unknown, fromUnit: AreaUnit, toUnit: AreaUnit): number {
  return convertAreaFromSquareMeters(normalizeAreaToSquareMeters(value, fromUnit), toUnit);
}

export function formatLengthValue(value: unknown, unit: LengthUnit = 'm', fractionDigits = 2): string {
  const numericValue = toFiniteNumber(value);
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: fractionDigits,
  }).format(numericValue) + ` ${unit}`;
}

export function formatAreaValue(value: unknown, unit: AreaUnit = 'sqm', fractionDigits = 2): string {
  const numericValue = toFiniteNumber(value);
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: fractionDigits,
  }).format(numericValue) + ` ${unit}`;
}
