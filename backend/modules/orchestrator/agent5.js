const AppError = require('../../utils/appError');

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

const runAgent5 = async ({ input, structured, engineering, cost, loss }) => {
  if (!input || !structured || !engineering || !cost || !loss) {
    throw new AppError('Agent5 requires full orchestration context', 400);
  }

  const area = Number(structured.geometry?.area || 0);
  const steelIndex = Number(engineering.structuralWeightIndex || 0);
  const baseCost = Number(cost.baseCost || 0);

  const primarySteelKg = roundToTwo(area * 3.2);
  const secondarySteelKg = roundToTwo(primarySteelKg * 0.24);
  const roofSheetingSqm = roundToTwo(area * 1.05);
  const boqValue = roundToTwo(primarySteelKg * 72 + secondarySteelKg * 58 + roofSheetingSqm * 18);

  return {
    items: [
      { item: 'Primary Steel', unit: 'kg', quantity: primarySteelKg, rate: 72, amount: roundToTwo(primarySteelKg * 72) },
      { item: 'Secondary Steel', unit: 'kg', quantity: secondarySteelKg, rate: 58, amount: roundToTwo(secondarySteelKg * 58) },
      { item: 'Roof Sheeting', unit: 'sqm', quantity: roofSheetingSqm, rate: 18, amount: roundToTwo(roofSheetingSqm * 18) }
    ],
    summary: {
      primarySteelKg,
      secondarySteelKg,
      roofSheetingSqm,
      boqValue
    },
    assumptions: [
      `Estimated from an area of ${roundToTwo(area)} sqm.`,
      `Structural weight index used for BOQ is ${roundToTwo(steelIndex)}.`,
      `Base cost reference for commercial planning is INR ${roundToTwo(baseCost)}.`
    ]
  };
};

module.exports = {
  runAgent5
};