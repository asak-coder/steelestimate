const Estimate = require('../../models/Estimate');
const AppError = require('../../utils/appError');

const ENGINE_VERSION = 'phase-1-v1';

const projectTypeConfig = {
  peb: {
    fabricationRatePerMt: 68000,
    erectionRatePerMt: 18500
  },
  industrial: {
    fabricationRatePerMt: 72500,
    erectionRatePerMt: 20500
  },
  warehouse: {
    fabricationRatePerMt: 65000,
    erectionRatePerMt: 17500
  },
  default: {
    fabricationRatePerMt: 70000,
    erectionRatePerMt: 19000
  }
};

const locationFactorMap = {
  urban: 1.08,
  suburban: 1.03,
  rural: 0.98,
  coastal: 1.1,
  industrial: 1.05,
  remote: 1.12
};

const workTypeFactorMap = {
  fabrication: 1.0,
  erection: 1.0,
  both: 1.0,
  turnkey: 1.06,
  retrofit: 1.08,
  expansion: 1.04
};

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeString = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const calculateHeightFactor = (height) => {
  if (height <= 8) return 1;
  if (height <= 12) return 1.08;
  if (height <= 18) return 1.15;
  if (height <= 24) return 1.24;
  return 1.35;
};

const calculateHazardFactor = (hazard) => (hazard ? 1.12 : 1);

const calculateShutdownFactor = (shutdown) => (shutdown ? 1.1 : 1);

const calculateNightShiftFactor = (nightShift) => (nightShift ? 1.07 : 1);

const getProjectRates = (projectType) => projectTypeConfig[normalizeString(projectType)] || projectTypeConfig.default;

const buildBoq = ({ tonnage, fabricationRatePerMt, erectionRatePerMt, heightFactor, hazardFactor, shutdownFactor, nightShiftFactor, locationFactor, workTypeFactor }) => {
  const fabricationAmount = roundToTwo(tonnage * fabricationRatePerMt);
  const erectionAmount = roundToTwo(tonnage * erectionRatePerMt * heightFactor);
  const handlingAmount = roundToTwo(tonnage * 2500 * locationFactor);
  const accessAmount = roundToTwo(tonnage * 1800 * hazardFactor);
  const shutdownAmount = roundToTwo(tonnage * 2200 * shutdownFactor);
  const nightShiftAmount = roundToTwo(tonnage * 1500 * nightShiftFactor);

  return [
    { item: 'Fabrication', unit: 'MT', quantity: roundToTwo(tonnage), rate: fabricationRatePerMt, amount: fabricationAmount },
    { item: 'Erection', unit: 'MT', quantity: roundToTwo(tonnage), rate: roundToTwo(erectionRatePerMt * heightFactor), amount: erectionAmount },
    { item: 'Material Handling', unit: 'MT', quantity: roundToTwo(tonnage), rate: roundToTwo(2500 * locationFactor), amount: handlingAmount },
    { item: 'Worksite Access', unit: 'MT', quantity: roundToTwo(tonnage), rate: roundToTwo(1800 * hazardFactor), amount: accessAmount },
    { item: 'Shutdown Premium', unit: 'MT', quantity: roundToTwo(tonnage), rate: roundToTwo(2200 * shutdownFactor), amount: shutdownAmount },
    { item: 'Night Shift Premium', unit: 'MT', quantity: roundToTwo(tonnage), rate: roundToTwo(1500 * nightShiftFactor), amount: nightShiftAmount },
    { item: 'Work Type Adjustment', unit: 'factor', quantity: roundToTwo(workTypeFactor), rate: 1, amount: roundToTwo((fabricationAmount + erectionAmount) * (workTypeFactor - 1)) }
  ];
};

const calculateCostEngine = (baseCost) => {
  const lossFactor = clamp(0.1 + (baseCost % 6) / 100, 0.1, 0.25);
  const overheadFactor = clamp(0.05 + (baseCost % 4) / 100, 0.05, 0.1);
  const marginFactor = clamp(0.15 + (baseCost % 10) / 100, 0.15, 0.3);

  const losses = roundToTwo(baseCost * lossFactor);
  const overhead = roundToTwo(baseCost * overheadFactor);
  const subtotal = roundToTwo(baseCost + losses + overhead);
  const margin = roundToTwo(subtotal * marginFactor);
  const finalAmount = roundToTwo(subtotal + margin);

  return {
    baseCost: roundToTwo(baseCost),
    lossFactor: roundToTwo(lossFactor),
    lossAmount: losses,
    overheadFactor: roundToTwo(overheadFactor),
    overheadAmount: overhead,
    marginFactor: roundToTwo(marginFactor),
    marginAmount: margin,
    subtotal,
    finalAmount
  };
};

const buildAssumptions = ({ projectType, workType, locationType, hazard, shutdown, nightShift }) => {
  const assumptions = [
    `Project type assessed as ${projectType}.`,
    `Work type assumed as ${workType}.`,
    `Location type considered ${locationType}.`
  ];

  if (hazard) assumptions.push('Hazard premium applied.');
  if (shutdown) assumptions.push('Shutdown premium applied.');
  if (nightShift) assumptions.push('Night shift premium applied.');

  assumptions.push('Estimation is preliminary and should be validated before execution.');
  return assumptions;
};

const buildWarnings = ({ height, tonnage, locationType }) => {
  const warnings = [];

  if (height > 24) warnings.push('High erection height increases access and safety risk.');
  if (tonnage > 100) warnings.push('Large tonnage may require detailed mobilization planning.');
  if (locationType === 'remote') warnings.push('Remote location may cause logistics variance.');

  return warnings;
};

const calculateEstimation = (input) => {
  const rates = getProjectRates(input.projectType);
  const workTypeFactor = workTypeFactorMap[normalizeString(input.workType)] || 1.03;
  const locationFactor = locationFactorMap[normalizeString(input.locationType)] || 1.04;
  const heightFactor = calculateHeightFactor(Number(input.height));
  const hazardFactor = calculateHazardFactor(Boolean(input.hazard));
  const shutdownFactor = calculateShutdownFactor(Boolean(input.shutdown));
  const nightShiftFactor = calculateNightShiftFactor(Boolean(input.nightShift));

  const boq = buildBoq({
    tonnage: Number(input.tonnage),
    fabricationRatePerMt: rates.fabricationRatePerMt,
    erectionRatePerMt: rates.erectionRatePerMt,
    heightFactor,
    hazardFactor,
    shutdownFactor,
    nightShiftFactor,
    locationFactor,
    workTypeFactor
  });

  const ruleBaseCost = boq.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const costEngine = calculateCostEngine(ruleBaseCost);

  const costBreakdown = {
    fabricationBaseRatePerMt: rates.fabricationRatePerMt,
    erectionBaseRatePerMt: rates.erectionRatePerMt,
    heightFactor: roundToTwo(heightFactor),
    hazardFactor: roundToTwo(hazardFactor),
    shutdownFactor: roundToTwo(shutdownFactor),
    nightShiftFactor: roundToTwo(nightShiftFactor),
    locationFactor: roundToTwo(locationFactor),
    workTypeFactor: roundToTwo(workTypeFactor),
    baseCost: costEngine.baseCost,
    lossFactor: costEngine.lossFactor,
    lossAmount: costEngine.lossAmount,
    overheadFactor: costEngine.overheadFactor,
    overheadAmount: costEngine.overheadAmount,
    marginFactor: costEngine.marginFactor,
    marginAmount: costEngine.marginAmount,
    subtotal: costEngine.subtotal
  };

  return {
    boq,
    costBreakdown,
    finalAmount: costEngine.finalAmount,
    assumptions: buildAssumptions(input),
    warnings: buildWarnings(input),
    calculationMeta: {
      engineVersion: ENGINE_VERSION,
      ruleBaseCost: costEngine.baseCost,
      factors: {
        heightFactor: roundToTwo(heightFactor),
        hazardFactor: roundToTwo(hazardFactor),
        shutdownFactor: roundToTwo(shutdownFactor),
        nightShiftFactor: roundToTwo(nightShiftFactor),
        locationFactor: roundToTwo(locationFactor),
        workTypeFactor: roundToTwo(workTypeFactor)
      }
    }
  };
};

const createEstimateRecord = async ({ userId, input }) => {
  if (!userId) {
    throw new AppError('Authentication required to save estimate', 401);
  }

  const calculation = calculateEstimation(input);

  const estimate = await Estimate.create({
    userId,
    projectType: normalizeString(input.projectType),
    inputs: input,
    assumptions: calculation.assumptions,
    results: {
      boq: calculation.boq,
      costBreakdown: calculation.costBreakdown,
      finalAmount: calculation.finalAmount
    },
    warnings: calculation.warnings,
    status: 'calculated',
    engineVersion: ENGINE_VERSION,
    calculationMeta: calculation.calculationMeta
  });

  return {
    estimate,
    output: {
      boq: calculation.boq,
      costBreakdown: calculation.costBreakdown,
      finalAmount: calculation.finalAmount
    }
  };
};

module.exports = {
  ENGINE_VERSION,
  calculateEstimation,
  createEstimateRecord
};