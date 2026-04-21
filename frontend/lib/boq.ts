import { calculateBoqRowCost } from './costEngine';
import { calculateMultiItemWeight, calculateWeight } from './weightEngine';

export type BoqMaterialType = 'IS' | 'PLATE' | 'PIPE';

export type BoqDimensions = Record<string, number | string>;

export type BoqRowDraft = {
  id: string;
  type: BoqMaterialType;
  section: string;
  dimensions: BoqDimensions;
  quantity: number;
  weight: number;
  cost: number;
};

export type BoqRowComputed = BoqRowDraft & {
  fabricationCost: number;
  erectionCost: number;
  totalWeight: number;
  totalCost: number;
};

export type BoqProjectPayload = {
  items: Array<{
    type: BoqMaterialType;
    section: string;
    dimensions: BoqDimensions;
    weight: number;
    cost: number;
  }>;
  totalWeight: number;
  totalCost: number;
  projectName?: string;
};

type WeightEngineInput = {
  type: BoqMaterialType;
  section: string;
  quantity: number;
  dimensions: BoqDimensions;
  length?: number;
  width?: number;
  thickness?: number;
  diameter?: number;
  outerDiameter?: number;
  innerDiameter?: number;
  weightPerMeter?: number;
};

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `boq-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizeDimensions(dimensions: unknown): BoqDimensions {
  if (!dimensions || typeof dimensions !== 'object' || Array.isArray(dimensions)) {
    return {};
  }

  return Object.entries(dimensions as Record<string, unknown>).reduce<BoqDimensions>((acc, [key, value]) => {
    if (value === null || value === undefined || value === '') {
      return acc;
    }

    const numericValue = typeof value === 'number' ? value : Number(value);
    acc[key] = Number.isFinite(numericValue) ? numericValue : String(value);
    return acc;
  }, {});
}

function getDimensionNumber(dimensions: BoqDimensions, keys: string[], fallback = 0) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(dimensions, key)) {
      const candidate = dimensions[key];
      const parsed = typeof candidate === 'number' ? candidate : Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

export function createEmptyBoqRow(): BoqRowDraft {
  return {
    id: createId(),
    type: 'IS',
    section: '',
    dimensions: {
      length: 0,
      quantity: 1,
    },
    quantity: 1,
    weight: 0,
    cost: 0,
  };
}

export function normalizeBoqRow(
  row: Partial<BoqRowDraft> & { dimensions?: BoqDimensions | null } = {},
): BoqRowDraft {
  const type = row.type === 'PLATE' || row.type === 'PIPE' ? row.type : 'IS';
  const dimensions = normalizeDimensions(row.dimensions);
  const quantity = Math.max(1, Math.floor(toNumber(row.quantity, 1)));

  return {
    id: toStringValue(row.id) || createId(),
    type,
    section: toStringValue(row.section),
    dimensions,
    quantity,
    weight: Math.max(0, toNumber(row.weight, 0)),
    cost: Math.max(0, toNumber(row.cost, 0)),
  };
}

export function toWeightEngineInput(row: Pick<BoqRowDraft, 'type' | 'section' | 'dimensions' | 'quantity'>): WeightEngineInput {
  const dimensions = normalizeDimensions(row.dimensions);
  const length = getDimensionNumber(dimensions, ['length', 'lengthM', 'lengthMeter', 'lengthMeters', 'lengthMm', 'l']);
  const width = getDimensionNumber(dimensions, ['width', 'widthM', 'widthMm', 'breadth', 'w']);
  const thickness = getDimensionNumber(dimensions, ['thickness', 'thicknessMm', 'thk', 't']);
  const diameter = getDimensionNumber(dimensions, ['diameter', 'dia', 'diameterMm', 'outerDiameter', 'outerDiameterMm', 'od']);
  const innerDiameter = getDimensionNumber(dimensions, ['innerDiameter', 'innerDiameterMm', 'id']);
  const weightPerMeter = getDimensionNumber(dimensions, [
    'weightPerMeter',
    'weightPerM',
    'wpm',
    'wtPerMeter',
    'weight',
  ]);
  const quantity = Math.max(1, Math.floor(toNumber(row.quantity, 1)));

  return {
    type: row.type,
    section: toStringValue(row.section),
    quantity,
    dimensions,
    length,
    width,
    thickness,
    diameter,
    outerDiameter: diameter,
    innerDiameter,
    weightPerMeter,
  };
}

function extractWeightValue(result: unknown) {
  if (typeof result === 'number' && Number.isFinite(result)) {
    return result;
  }

  if (result && typeof result === 'object') {
    const candidate = result as Record<string, unknown>;
    const values = [candidate.weight, candidate.totalWeight, candidate.value, candidate.result];

    for (const value of values) {
      const parsed = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return Number.NaN;
}

function callWeightCalculator(input: WeightEngineInput) {
  try {
    const weight = extractWeightValue(calculateWeight(input.type as never, input as never));
    if (Number.isFinite(weight)) {
      return weight;
    }
  } catch {
    // fall through to the manual fallback below
  }

  const fallbackWeight =
    input.type === 'PLATE'
      ? getDimensionNumber(input.dimensions, ['weight', 'totalWeight'], 0)
      : getDimensionNumber(input.dimensions, ['weight', 'totalWeight'], 0);

  return Number.isFinite(fallbackWeight) ? fallbackWeight : 0;
}

function callMultiItemWeightCalculator(inputs: WeightEngineInput[]) {
  const strategies: Array<() => unknown> = [
    () => calculateMultiItemWeight(inputs as never),
    () =>
      calculateMultiItemWeight(
        inputs.map((item) => ({
          type: item.type,
          section: item.section,
          quantity: item.quantity,
          dimensions: item.dimensions,
        })) as never,
      ),
  ];

  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (typeof result === 'number' && Number.isFinite(result)) {
        return result;
      }

      if (result && typeof result === 'object') {
        const candidate = result as Record<string, unknown>;
        const values = [candidate.weight, candidate.totalWeight, candidate.value, candidate.result];
        for (const value of values) {
          const parsed = typeof value === 'number' ? value : Number(value);
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
      }
    } catch {
      // try the next call signature
    }
  }

  return 0;
}

export function calculateBoqRowWeight(row: Pick<BoqRowDraft, 'type' | 'section' | 'dimensions' | 'quantity'>) {
  return callWeightCalculator(toWeightEngineInput(row));
}

export function calculateBoqRowsWeight(rows: Array<Pick<BoqRowDraft, 'type' | 'section' | 'dimensions' | 'quantity'>>) {
  const inputs = rows.map((row) => toWeightEngineInput(row));
  const totalWeight = callMultiItemWeightCalculator(inputs);

  if (Number.isFinite(totalWeight) && totalWeight > 0) {
    return totalWeight;
  }

  return rows.reduce((sum, row) => sum + calculateBoqRowWeight(row), 0);
}

export function calculateBoqRowComputed(row: Partial<BoqRowDraft> & { dimensions?: BoqDimensions | null } = {}): BoqRowComputed {
  const normalized = normalizeBoqRow(row);
  const weight = calculateBoqRowWeight(normalized);
  const { fabricationCost, erectionCost, totalCost } = calculateBoqRowCost(weight);

  return {
    ...normalized,
    weight,
    cost: totalCost,
    fabricationCost,
    erectionCost,
    totalWeight: weight,
    totalCost,
  };
}

export function buildBoqSavePayload(
  rows: Array<Partial<BoqRowDraft> & { dimensions?: BoqDimensions | null }>,
  projectName?: string,
): BoqProjectPayload {
  const computedRows = rows.map((row) => calculateBoqRowComputed(row));
  const totalWeight = computedRows.reduce((sum, row) => sum + row.weight, 0);
  const totalCost = computedRows.reduce((sum, row) => sum + row.cost, 0);

  return {
    items: computedRows.map((row) => ({
      type: row.type,
      section: row.section,
      dimensions: row.dimensions,
      weight: row.weight,
      cost: row.cost,
    })),
    totalWeight,
    totalCost,
    ...(toStringValue(projectName) ? { projectName: toStringValue(projectName) } : {}),
  };
}
