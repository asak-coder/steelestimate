const AppError = require('../../utils/appError');

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

const runAgent2 = async (structured) => {
  if (!structured || typeof structured !== 'object') {
    throw new AppError('Agent2 requires structured input from Agent1', 400);
  }

  const geometry = structured.geometry || {};
  const length = Number(geometry.length || 0);
  const width = Number(geometry.width || 0);
  const height = Number(geometry.height || 0);
  const area = Number(geometry.area || (length * width));
  const spanFactor = width >= 30 ? 1.18 : width >= 20 ? 1.1 : width >= 12 ? 1.04 : 0.98;
  const heightFactor = height > 18 ? 1.16 : height > 12 ? 1.1 : height > 8 ? 1.04 : 1;
  const complexityFactor = roundToTwo(spanFactor * heightFactor);
  const structuralWeightIndex = roundToTwo((area * complexityFactor) / 18);

  return {
    geometry: {
      length,
      width,
      height,
      area: roundToTwo(area)
    },
    spanFactor: roundToTwo(spanFactor),
    heightFactor: roundToTwo(heightFactor),
    complexityFactor,
    structuralWeightIndex,
    designBasis: {
      framing: structured.structureType,
      spanCategory: structured.spanCategory,
      riskProfile: structured.riskProfile
    },
    confidenceScore: roundToTwo(Math.max(62, Math.min(96, 90 - ((complexityFactor - 1) * 25))))
  };
};

module.exports = {
  runAgent2
};