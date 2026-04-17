const Estimate = require('../models/Estimate');
const { generateQuotationPdf } = require('./pdfService');
const { calculatePebEstimate } = require('./calculations/pebCalc');

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

function buildPEBAssumptions(inputs, results = {}) {
  const assumptions = [
    'Preliminary estimation only.',
    'Based on standard PEB industry practice with simplified IS code usage.',
    'Detailed structural analysis, connection design, and fabrication detailing are excluded.'
  ];

  if (!inputs?.crane) {
    assumptions.push('Crane provision is assumed to be absent unless specified.');
  } else {
    assumptions.push(`Crane provision included with capacity ${inputs.craneCapacity || 'not specified'} MT.`);
  }

  if (results?.steelWeight) {
    assumptions.push(`Estimated steel weight derived from area and loading rules: ${roundToTwo(results.steelWeight)} kg.`);
  }

  assumptions.push('Not for final structural design. Detailed analysis required before execution.');

  return assumptions;
}

function buildPEBWarnings(inputs) {
  const warnings = [];

  if (!inputs?.geometry?.length || !inputs?.geometry?.width || !inputs?.geometry?.height) {
    warnings.push('Incomplete geometry supplied; estimation accuracy is reduced.');
  }

  if (!inputs?.location) {
    warnings.push('Location is required for accurate wind-based assumptions.');
  }

  if (!inputs?.soilData) {
    warnings.push('Soil data not provided; default foundation assumptions were used.');
  }

  if (!inputs?.loads) {
    warnings.push('Load inputs not provided; quick-estimate defaults were used.');
  }

  warnings.push('Not for final structural design. Detailed analysis required before execution.');

  return warnings;
}

function normalizeEstimateInputs(projectType, inputs) {
  const safeInputs = inputs && typeof inputs === 'object' ? inputs : {};

  if (projectType === 'peb') {
    return {
      geometry: safeInputs.geometry || {
        length: safeInputs.length,
        width: safeInputs.width,
        height: safeInputs.height,
        span: safeInputs.span
      },
      soilData: safeInputs.soilData || {},
      loads: safeInputs.loads || {},
      designCode: safeInputs.designCode,
      unitSystem: safeInputs.unitSystem || 'metric',
      location: safeInputs.location,
      crane: Boolean(safeInputs.crane),
      craneCapacity: safeInputs.craneCapacity ?? null
    };
  }

  return safeInputs;
}

async function createEstimateRecord({ userId, projectType, inputs, source = 'api' }) {
  const normalizedProjectType = typeof projectType === 'string' && projectType.trim() ? projectType.trim().toLowerCase() : 'peb';
  const normalizedInputs = normalizeEstimateInputs(normalizedProjectType, inputs);

  let estimatePayload = {
    inputs: normalizedInputs,
    assumptions: buildPEBAssumptions(normalizedInputs),
    results: {
      steelWeight: 0,
      steelTonnage: 0,
      windLoad: 0,
      deadLoad: 0,
      totalLoad: 0,
      columnLoad: 0
    },
    warnings: buildPEBWarnings(normalizedInputs),
    meta: {
      estimationType: 'preliminary',
      codeReference: 'IS 800 / IS 875'
    }
  };

  if (normalizedProjectType === 'peb') {
    estimatePayload = calculatePebEstimate(normalizedInputs);
  }

  const estimate = await Estimate.create({
    userId,
    projectType: normalizedProjectType,
    inputs: estimatePayload.inputs,
    assumptions: estimatePayload.assumptions,
    results: {
      ...estimatePayload.results,
      source
    },
    warnings: estimatePayload.warnings,
    meta: estimatePayload.meta
  });

  return estimate;
}

async function fetchEstimateById(id) {
  return Estimate.findById(id);
}

async function generateEstimatePdfBuffer(estimate) {
  return generateQuotationPdf({
    clientDetails: {
      clientName: estimate.clientName || '',
      phone: estimate.phone || '',
      email: estimate.email || ''
    },
    input: {
      location: estimate.inputs?.location,
      length: estimate.inputs?.geometry?.length || estimate.inputs?.length,
      width: estimate.inputs?.geometry?.width || estimate.inputs?.width,
      height: estimate.inputs?.geometry?.height || estimate.inputs?.height,
      crane: estimate.inputs?.crane,
      craneCapacity: estimate.inputs?.craneCapacity
    },
    calc: {
      areaSqm: (Number(estimate.inputs?.geometry?.length || estimate.inputs?.length || 0) * Number(estimate.inputs?.geometry?.width || estimate.inputs?.width || 0)),
      areaSqft: (Number(estimate.inputs?.geometry?.length || estimate.inputs?.length || 0) * Number(estimate.inputs?.geometry?.width || estimate.inputs?.width || 0)) * 10.7639,
      steelRatePerSqm: estimate.results?.steelWeight ? roundToTwo(estimate.results.steelWeight / Math.max((Number(estimate.inputs?.geometry?.length || estimate.inputs?.length || 1) * Number(estimate.inputs?.geometry?.width || estimate.inputs?.width || 1)), 1)) : 0,
      estimatedSteelWeightKg: estimate.results?.steelWeight || 0
    },
    boq: estimate.results?.boq || {},
    cost: estimate.results?.cost || {},
    quotationText: estimate.results?.quotationText || estimate.quotationText || ''
  });
}

module.exports = {
  createEstimateRecord,
  fetchEstimateById,
  generateEstimatePdfBuffer
};
