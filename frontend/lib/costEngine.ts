export const BOQ_FABRICATION_RATE_PER_KG = 50;
export const BOQ_ERECTION_RATE_PER_KG = 25;

export function calculateBoqRowCost(weightKg: number) {
  const weight = Number.isFinite(weightKg) ? Math.max(0, weightKg) : 0;
  const fabricationCost = weight * BOQ_FABRICATION_RATE_PER_KG;
  const erectionCost = weight * BOQ_ERECTION_RATE_PER_KG;

  return {
    fabricationCost,
    erectionCost,
    totalCost: fabricationCost + erectionCost,
  };
}

export function calculateBoqTotalsCost(totalWeightKg: number) {
  return calculateBoqRowCost(totalWeightKg);
}