const AppError = require('../../utils/appError');

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

const runAgent3 = async ({ input, structured, engineering }) => {
  if (!input || !structured || !engineering) {
    throw new AppError('Agent3 requires input, structured, and engineering data', 400);
  }

  const baseWeight = Number(engineering.structuralWeightIndex || 0);
  const locationType = String(input.locationType || '').toLowerCase();
  const workType = String(input.workType || '').toLowerCase();
  const locationMultiplier = locationType === 'remote' ? 1.12 : locationType === 'coastal' ? 1.08 : locationType === 'urban' ? 1.05 : 1;
  const workMultiplier = workType === 'turnkey' ? 1.08 : workType === 'retrofit' ? 1.06 : workType === 'expansion' ? 1.03 : 1;

  const fabricationCost = roundToTwo(baseWeight * 78000 * locationMultiplier);
  const erectionCost = roundToTwo(baseWeight * 21000 * workMultiplier);
  const engineeringCost = roundToTwo((Number(input.height || 0) + Number(input.tonnage || 0) / 10) * 3500);

  const baseCost = roundToTwo(fabricationCost + erectionCost + engineeringCost);

  return {
    baseCost,
    fabricationCost,
    erectionCost,
    engineeringCost,
    locationMultiplier: roundToTwo(locationMultiplier),
    workMultiplier: roundToTwo(workMultiplier),
    currency: 'INR',
    costBasis: 'deterministic-cost-engine'
  };
};

module.exports = {
  runAgent3
};