'use strict';

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Preliminary foundation allowance estimator for PEB projects.
 *
 * @param {Object} input
 * @param {Object} loadSummary
 * @param {Object} steelSummary
 * @returns {Object}
 */
function estimateFoundationAllowance(input, loadSummary, steelSummary) {
  const planArea = toNumber(input && input.length, 0) * toNumber(input && input.width, 0);
  const governingLoad = loadSummary && loadSummary.governingKnPerSqm ? toNumber(loadSummary.governingKnPerSqm, 0) : 0;
  const steelTonnes = steelSummary && steelSummary.totalSteelTonnes ? toNumber(steelSummary.totalSteelTonnes, 0) : 0;

  const index = Math.max(0.08, governingLoad * 0.035);
  const footingAllowanceTonnes = steelTonnes * index;
  const civilAllowancePct = planArea > 0 ? Math.min(0.12, 0.045 + governingLoad * 0.002) : 0.05;

  return {
    success: true,
    data: {
      foundation: {
        planAreaSqm: round(planArea, 2),
        governingLoadKnPerSqm: round(governingLoad, 3),
        footingAllowanceTonnes: round(footingAllowanceTonnes, 3),
        civilAllowancePct: round(civilAllowancePct, 3)
      }
    },
    warnings: [],
    meta: {
      module: 'foundationCalc',
      method: 'estimateFoundationAllowance',
      deterministic: true
    }
  };
}

module.exports = {
  estimateFoundationAllowance: estimateFoundationAllowance
};