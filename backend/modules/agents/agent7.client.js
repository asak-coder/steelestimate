const { callOpenAIJson } = require('../../services/aiQuotationService');

const DEFAULT_RESULT = {
  recommendedPricingStrategy: 'balanced',
  suggestedMarginRange: {
    min: 15,
    max: 25
  },
  negotiationProbability: 'medium',
  summary: 'Fallback client strategy applied due to unavailable or invalid AI response.'
};

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeStrategy(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function normalizeNegotiationProbability(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (['low', 'medium', 'high'].includes(normalized)) {
    return normalized;
  }

  return null;
}

function normalizeSummary(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return DEFAULT_RESULT.summary;
}

function validateClientResult(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const recommendedPricingStrategy = normalizeStrategy(payload.recommendedPricingStrategy);
  const marginRange = payload.suggestedMarginRange;
  const negotiationProbability = normalizeNegotiationProbability(payload.negotiationProbability);
  const summary = normalizeSummary(payload.summary);

  if (!recommendedPricingStrategy) {
    return null;
  }

  if (!marginRange || typeof marginRange !== 'object' || Array.isArray(marginRange)) {
    return null;
  }

  const min = Number(marginRange.min);
  const max = Number(marginRange.max);

  if (!isFiniteNumber(min) || !isFiniteNumber(max) || min < 0 || max < 0 || min > max) {
    return null;
  }

  if (!negotiationProbability) {
    return null;
  }

  return {
    recommendedPricingStrategy,
    suggestedMarginRange: {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100
    },
    negotiationProbability,
    summary
  };
}

function buildPrompt(input) {
  return {
    role: 'user',
    content: [
      'You are Agent 7 for a steel estimating platform.',
      'Return only valid JSON with the exact keys: recommendedPricingStrategy, suggestedMarginRange, negotiationProbability, summary.',
      'recommendedPricingStrategy should be a concise strategy label.',
      'suggestedMarginRange must be an object with numeric min and max percentages.',
      'negotiationProbability must be one of: low, medium, high.',
      'Do not include markdown, code fences, explanations, or extra keys.',
      'Input:',
      JSON.stringify(input)
    ].join('\n')
  };
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Agent 7 request timed out'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runAgent7Client(input = {}) {
  const safeInput = {
    clientProfile: {
      clientType: input?.clientProfile?.clientType || null
    },
    projectDetails: {
      riskLevel: input?.projectDetails?.riskLevel || null,
      estimatedValue: input?.projectDetails?.estimatedValue ?? null
    }
  };

  const fallback = {
    ...DEFAULT_RESULT,
    suggestedMarginRange: { ...DEFAULT_RESULT.suggestedMarginRange }
  };

  try {
    const response = await withTimeout(
      callOpenAIJson({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        systemPrompt: 'You are a precise client strategy assistant. Output strict JSON only.',
        userMessage: buildPrompt(safeInput).content,
        temperature: 0.2,
        maxTokens: 220
      }),
      6500
    );

    const validated = validateClientResult(response);
    return validated || fallback;
  } catch (error) {
    return fallback;
  }
}

module.exports = {
  runAgent7Client,
  validateClientResult
};