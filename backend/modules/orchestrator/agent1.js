const AppError = require('../../utils/appError');

const normalize = (value) => String(value || '').trim().toLowerCase();

const projectTypeRules = {
  peb: {
    structureType: 'pre-engineered building',
    defaultSpanCategory: 'medium-span',
    riskProfile: 'balanced'
  },
  industrial: {
    structureType: 'industrial steel frame',
    defaultSpanCategory: 'heavy-duty',
    riskProfile: 'moderate'
  },
  warehouse: {
    structureType: 'warehouse shell',
    defaultSpanCategory: 'long-span',
    riskProfile: 'cost-sensitive'
  },
  default: {
    structureType: 'steel structure',
    defaultSpanCategory: 'standard',
    riskProfile: 'balanced'
  }
};

const runAgent1 = async (input) => {
  if (!input || typeof input !== 'object') {
    throw new AppError('Agent1 requires a valid input payload', 400);
  }

  const projectType = normalize(input.projectType);
  const rules = projectTypeRules[projectType] || projectTypeRules.default;

  return {
    projectType,
    structureType: rules.structureType,
    spanCategory: rules.defaultSpanCategory,
    riskProfile: rules.riskProfile,
    geometry: {
      length: Number(input.length || 0),
      width: Number(input.width || 0),
      height: Number(input.height || 0),
      area: Number(input.area || 0) || Number(input.length || 0) * Number(input.width || 0)
    },
    siteProfile: {
      locationType: normalize(input.locationType || 'unknown'),
      workType: normalize(input.workType || 'both'),
      hazard: Boolean(input.hazard),
      shutdown: Boolean(input.shutdown),
      nightShift: Boolean(input.nightShift)
    },
    assumptions: [
      `Project type normalized to ${projectType || 'default'}.`,
      `Structure classified as ${rules.structureType}.`,
      `Initial risk profile set to ${rules.riskProfile}.`
    ]
  };
};

module.exports = {
  runAgent1
};