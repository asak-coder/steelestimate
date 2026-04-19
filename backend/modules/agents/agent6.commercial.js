const { callOpenAIJson } = require('../../services/aiQuotationService');

const DEFAULT_RESULT = {
  riskLevel: 'medium',
  recommendedMargin: 20,
  recommendedRiskBuffer: 10,
  insights: 'Fallback commercial assessment applied due to unavailable or invalid AI response.'
};

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRiskLevel(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (['low', 'medium', 'high'].includes(normalized)) {
    return normalized;
  }

  return null;
}

function normalizeInsights(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return DEFAULT_RESULT.insights;
}

function validateCommercialResult(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const riskLevel = normalizeRiskLevel(payload.riskLevel);
  const recommendedMargin = Number(payload.recommendedMargin);
  const recommendedRiskBuffer = Number(payload.recommendedRiskBuffer);
  const insights = normalizeInsights(payload.insights);

  if (!riskLevel) {
    return null;
  }

  if (!isFiniteNumber(recommendedMargin) || recommendedMargin < 0 || recommendedMargin > 100) {
    return null;
  }

  if (!isFiniteNumber(recommendedRiskBuffer) || recommendedRiskBuffer < 0 || recommendedRiskBuffer > 100) {
    return null;
  }

  return {
    riskLevel,
    recommendedMargin: Math.round(recommendedMargin * 100) / 100,
    recommendedRiskBuffer: Math.round(recommendedRiskBuffer * 100) / 100,
    insights
  };
}

function buildPrompt(input) {
  return {
    role: 'user',
    content: [
      'You are Agent 6 for a steel estimating platform.',
      'Return only valid JSON with the exact keys: riskLevel, recommendedMargin, recommendedRiskBuffer, insights.',
      'riskLevel must be one of: low, medium, high.',
      'recommendedMargin and recommendedRiskBuffer must be numeric percentages.',
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
      reject(new Error('Agent 6 request timed out'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runAgent6Commercial(input = {}) {
  const safeInput = {
    projectDetails: {
      projectType: input?.projectDetails?.projectType || null,
      height: input?.projectDetails?.height || null,
      hazard: input?.projectDetails?.hazard || null
    },
    costBreakdown: {
      fabrication: input?.costBreakdown?.fabrication ?? null,
      erection: input?.costBreakdown?.erection ?? null,
      total: input?.costBreakdown?.total ?? null
    },
    lossModel: {
      adjustedCost: input?.lossModel?.adjustedCost ?? null
    }
  };

  const fallback = { ...DEFAULT_RESULT };

  try {
    const response = await withTimeout(
      callOpenAIJson({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        systemPrompt: 'You are a precise commercial pricing assistant. Output strict JSON only.',
        userMessage: buildPrompt(safeInput).content,
        temperature: 0.2,
        maxTokens: 250
      }),
      6500
    );

    const validated = validateCommercialResult(response);
    return validated || fallback;
  } catch (error) {
    return fallback;
  }
}

module.exports = {
  runAgent6Commercial,
  validateCommercialResult
};