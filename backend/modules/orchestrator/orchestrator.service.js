const AppError = require('../../utils/appError');
const Estimate = require('../../models/Estimate');
const LearningData = require('../../models/LearningData');
const { orchestrateEstimationCore } = require('../estimation/estimation.service');
const { roundToTwo } = require('../agents/agentMath');

const withTimeout = async (promiseFactory, timeoutMs = 12000, fallbackFactory = null) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new AppError('Orchestrator timed out', 504)), timeoutMs);
  });

  try {
    const result = await Promise.race([promiseFactory(), timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (typeof fallbackFactory === 'function') {
      return fallbackFactory(error);
    }

    throw error;
  }
};

const normalizeObject = (value, fallback = {}) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }

  return value;
};

const normalizeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const validateOutput = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new AppError('Invalid orchestrator response', 500);
  }

  const requiredKeys = ['boq', 'cost', 'loss', 'recommendedMargin', 'riskLevel', 'strategy', 'winProbability', 'finalAmount'];
  for (const key of requiredKeys) {
    if (typeof payload[key] === 'undefined' || payload[key] === null) {
      throw new AppError(`Missing orchestrator field: ${key}`, 500);
    }
  }

  return payload;
};

const buildFallbackPayload = (input = {}) => ({
  boq: {
    primarySteelKg: 0,
    secondarySteelKg: 0,
    roofSheetingSqm: 0,
    estimatedSteelWeightKg: 0,
    boltsKg: 0,
    primerKg: 0,
    paintKg: 0
  },
  cost: {
    baseSteelCost: 0,
    heightPremium: 0,
    complexityPremium: 0,
    contingency: 0,
    grandTotal: 0,
    costPerTon: 0
  },
  loss: 0,
  recommendedMargin: 0,
  riskLevel: 'high',
  strategy: 'deterministic fallback pricing',
  winProbability: 10,
  finalAmount: 0,
  metadata: {
    fallback: true,
    input
  },
  insights: ['Fallback response generated due to upstream validation or timeout.']
});

const buildEstimateDocument = (input, result, userId) => {
  const cost = normalizeObject(result.cost);
  const loss = normalizeObject(result.loss);
  const commercial = normalizeObject(result.commercial);
  const clientStrategy = normalizeObject(result.clientStrategy);
  const engineering = normalizeObject(result.engineering, {
    boq: normalizeObject(result.boq),
    insights: Array.isArray(result.insights) ? result.insights : []
  });

  return {
    userId,
    input,
    engineering,
    cost,
    loss,
    commercial,
    clientStrategy,
    finalAmount: normalizeNumber(result.finalAmount, 0)
  };
};

const buildLearningDataDocument = (estimateId, input, result) => ({
  estimateId,
  input,
  aiSuggestions: {
    commercial: normalizeObject(result.commercial),
    clientStrategy: normalizeObject(result.clientStrategy),
    insights: Array.isArray(result.insights) ? result.insights : [],
    riskLevel: result.riskLevel || 'medium',
    recommendedMargin: normalizeNumber(result.recommendedMargin, 20),
    recommendedRiskBuffer: normalizeNumber(result.recommendedRiskBuffer, 10)
  },
  actualOutcome: {
    status: 'open'
  }
});

const orchestrateEstimate = async ({ input = {}, userId = null } = {}) => {
  const normalizedInput = {
    projectType: String(input.projectType || '').trim() || 'general',
    tonnage: Number(input.tonnage || 0),
    height: Number(input.height || 0),
    hazard: Boolean(input.hazard ?? input.hazardToggle ?? false),
    clientType: String(input.clientType || 'standard').trim() || 'standard',
    ...input
  };

  return withTimeout(
    async () => {
      const result = await orchestrateEstimationCore({
        input: normalizedInput,
        userId,
        useAi: true
      });

      const safeResult = validateOutput({
        ...result,
        cost: normalizeObject(result.cost),
        loss: normalizeObject(result.loss),
        commercial: normalizeObject(result.commercial),
        clientStrategy: normalizeObject(result.clientStrategy),
        engineering: normalizeObject(result.engineering, {
          boq: normalizeObject(result.boq),
          insights: Array.isArray(result.insights) ? result.insights : []
        }),
        recommendedMargin: roundToTwo(result.recommendedMargin),
        winProbability: roundToTwo(result.winProbability),
        finalAmount: roundToTwo(result.finalAmount)
      });

      const estimateDoc = buildEstimateDocument(normalizedInput, safeResult, userId);
      const savedEstimate = userId ? await Estimate.create(estimateDoc) : null;

      if (savedEstimate) {
        await LearningData.create(buildLearningDataDocument(savedEstimate._id, normalizedInput, safeResult));
      }

      return validateOutput(safeResult);
    },
    12000,
    () => buildFallbackPayload(normalizedInput)
  );
};

module.exports = {
  orchestrateEstimate,
  validateOutput,
  buildFallbackPayload
};