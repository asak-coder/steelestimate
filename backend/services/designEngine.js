const { getDesignCodeParameters } = require('../designCodeEngine');
const { estimateCost } = require('./costService');
const { generateBOQ } = require('./boqService');

const roundToTwo = (value) => Math.round(value * 100) / 100;

const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

function validateInput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Input data must be an object');
  }

  const { geometry, soilData, loads, designCode, unitSystem } = data;

  if (!geometry || typeof geometry !== 'object') {
    throw new Error('geometry must be an object');
  }

  const { length, width, height } = geometry;

  if (!isPositiveNumber(length)) {
    throw new Error('geometry.length must be a positive number');
  }

  if (!isPositiveNumber(width)) {
    throw new Error('geometry.width must be a positive number');
  }

  if (!isPositiveNumber(height)) {
    throw new Error('geometry.height must be a positive number');
  }

  return {
    geometry: { length, width, height },
    soilData: soilData && typeof soilData === 'object' ? soilData : {},
    loads: loads && typeof loads === 'object' ? loads : {},
    designCode,
    unitSystem: typeof unitSystem === 'string' && unitSystem.trim() ? unitSystem.trim().toLowerCase() : 'metric',
  };
}

function resolveArea(geometry, unitSystem) {
  const areaSqm = geometry.length * geometry.width;

  if (unitSystem === 'imperial') {
    return areaSqm / 10.7639;
  }

  return areaSqm;
}

function resolveSteelWeight(areaSqm, height, loads, designCodeParams, soilData) {
  const loadDemand = (loads.deadLoad || 0) + (loads.liveLoad || 0) + (loads.windLoad || 0);
  const soilFactor = typeof soilData.soilFactor === 'number' && soilData.soilFactor > 0 ? soilData.soilFactor : 1;
  const safetyFactor = designCodeParams.safetyFactor || 1;

  let baseRate = 28;

  if (height > 10) {
    baseRate = 34;
  } else if (height > 6) {
    baseRate = 31;
  }

  const demandMultiplier = 1 + (loadDemand / 1000);
  const adjustedRate = baseRate * safetyFactor * demandMultiplier / soilFactor;

  return roundToTwo(areaSqm * adjustedRate);
}

function resolveSections(height, designCodeParams, steelWeight) {
  const steelGrade = designCodeParams.steelGrade || 250;
  const columnSection = height <= 6 ? 'ISMC 150' : height <= 10 ? 'ISMC 200' : 'ISMC 250';
  const rafterDepth = roundToTwo((steelGrade / 50) + (steelWeight / 5000));

  return {
    columnSection,
    rafterDepth,
  };
}

function resolveFoundationType(soilData) {
  if (soilData && typeof soilData.foundationType === 'string' && soilData.foundationType.trim()) {
    return soilData.foundationType.trim();
  }

  return 'isolated footing';
}

function resolveSafetyMargin(loads, designCodeParams, soilData) {
  const totalLoad = (loads.deadLoad || 0) + (loads.liveLoad || 0) + (loads.windLoad || 0);
  const soilFactor = typeof soilData.soilFactor === 'number' && soilData.soilFactor > 0 ? soilData.soilFactor : 1;
  const baseMargin = 100 / (designCodeParams.safetyFactor || 1);

  return roundToTwo(baseMargin + (soilFactor * 5) - (totalLoad / 200));
}

function generatePEBDesign(data) {
  const input = validateInput(data);
  const designCodeParams = getDesignCodeParameters(input.designCode);
  const areaSqm = resolveArea(input.geometry, input.unitSystem);
  const steelWeight = resolveSteelWeight(areaSqm, input.geometry.height, input.loads, designCodeParams, input.soilData);
  const boqInput = {
    estimatedSteelWeightKg: steelWeight,
    areaSqm,
  };
  const boq = generateBOQ(boqInput);
  const cost = estimateCost(boq);
  const sections = resolveSections(input.geometry.height, designCodeParams, steelWeight);
  const foundationType = resolveFoundationType(input.soilData);
  const safetyMargin = resolveSafetyMargin(input.loads, designCodeParams, input.soilData);

  return {
    steelWeight,
    cost,
    boq,
    columnSection: sections.columnSection,
    rafterDepth: sections.rafterDepth,
    foundationType,
    safetyMargin,
  };
}

module.exports = {
  generatePEBDesign,
};