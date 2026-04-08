const { calculateSteelTonnage } = require('./steelCalc');
const { calculateTotalLoad } = require('./loadCalc');

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

function normalizeGeometry(geometry = {}) {
  return {
    length: Math.max(Number(geometry.length) || 0, 0),
    width: Math.max(Number(geometry.width) || 0, 0),
    height: Math.max(Number(geometry.height) || 0, 0),
    span: Math.max(Number(geometry.span) || Number(geometry.width) || 0, 0)
  };
}

function calculatePebEstimate(params = {}) {
  const geometry = params.geometry || {};
  const location = params.location || {};
  const loads = params.loads || {};
  const crane = Boolean(params.crane);
  const craneCapacity = params.craneCapacity ?? null;

  const normalizedGeometry = normalizeGeometry(geometry);
  const windSpeed = Math.max(
    Number(location.windSpeed || loads.windSpeed || loads.wind || 0) || 0,
    0
  );

  const steel = calculateSteelTonnage({
    ...normalizedGeometry,
    windSpeed
  });

  const loadSummary = calculateTotalLoad({
    steelWeight: steel.steelWeight,
    windSpeed
  });

  const bays = Math.max(Number(geometry.bays) || 0, 0);
  const columns = Math.max((bays + 1) * 2, 1);
  const columnLoad = roundToTwo(loadSummary.totalLoad / columns);

  const results = {
    steelWeight: steel.steelWeight,
    steelTonnage: steel.steelTonnage,
    windLoad: loadSummary.windLoad,
    deadLoad: loadSummary.deadLoad,
    totalLoad: loadSummary.totalLoad,
    columnLoad,
    area: roundToTwo(steel.area),
    factor: steel.factor,
    columns
  };

  const assumptions = [
    'Preliminary estimation only.',
    'Based on standard PEB industry practice with simplified IS code usage.',
    'Detailed structural analysis, connection design, and fabrication detailing are excluded.'
  ];

  if (!crane) {
    assumptions.push('Crane provision is assumed to be absent unless specified.');
  } else {
    assumptions.push(`Crane provision included with capacity ${craneCapacity || 'not specified'} MT.`);
  }

  const warnings = [];
  if (!normalizedGeometry.length || !normalizedGeometry.width || !normalizedGeometry.height) {
    warnings.push('Incomplete geometry supplied; estimation accuracy is reduced.');
  }
  if (!windSpeed) {
    warnings.push('Wind speed not provided; wind-based sizing defaults were applied.');
  }
  warnings.push('Not for final structural design. Detailed analysis required before execution.');

  return {
    inputs: {
      geometry: normalizedGeometry,
      location,
      loads,
      crane: Boolean(crane),
      craneCapacity: craneCapacity ?? null,
      windSpeed
    },
    assumptions,
    results,
    warnings,
    meta: {
      estimationType: 'preliminary',
      codeReference: 'IS 800 / IS 875'
    }
  };
}

module.exports = {
  calculatePebEstimate
};
