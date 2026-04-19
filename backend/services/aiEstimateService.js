let OpenAI;
try {
  OpenAI = require('openai');
} catch (error) {
  OpenAI = null;
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const PROJECT_TYPE_CONFIG = {
  warehouse: { minSteelPerSqft: 4, maxSteelPerSqft: 6 },
  industrial: { minSteelPerSqft: 6, maxSteelPerSqft: 8 },
  default: { minSteelPerSqft: 5, maxSteelPerSqft: 7 },
};
const COST_PER_KG_RANGE = { min: 70, max: 90 };

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeString = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getProjectConfig = (projectType) => PROJECT_TYPE_CONFIG[normalizeString(projectType)] || PROJECT_TYPE_CONFIG.default;

const buildRuleBasedResult = ({ projectType, area }) => {
  const projectConfig = getProjectConfig(projectType);
  const areaValue = Math.max(0, toNumber(area));

  const steelPerSqft = {
    min: roundToTwo(projectConfig.minSteelPerSqft),
    max: roundToTwo(projectConfig.maxSteelPerSqft),
    unit: 'kg/sqft',
  };

  const totalSteelKg = {
    min: roundToTwo(areaValue * steelPerSqft.min),
    max: roundToTwo(areaValue * steelPerSqft.max),
    unit: 'kg',
  };

  const costPerKg = {
    min: roundToTwo(COST_PER_KG_RANGE.min),
    max: roundToTwo(COST_PER_KG_RANGE.max),
    unit: 'INR/kg',
  };

  const costRangeInr = {
    min: roundToTwo(totalSteelKg.min * costPerKg.min),
    max: roundToTwo(totalSteelKg.max * costPerKg.max),
    unit: 'INR',
  };

  return {
    steelPerSqft,
    totalSteelKg,
    costPerKg,
    costRangeInr,
  };
};

const buildAdjustedFallback = ({ input, ruleBasedResult }) => {
  const heightValue = toNumber(input.height);
  const location = normalizeString(input.location);
  const projectType = normalizeString(input.projectType);

  let adjustmentFactor = 1;

  if (heightValue > 24) adjustmentFactor += 0.08;
  else if (heightValue > 15) adjustmentFactor += 0.05;
  else if (heightValue > 10) adjustmentFactor += 0.03;

  if (location.includes('coastal')) adjustmentFactor += 0.04;
  if (location.includes('industrial')) adjustmentFactor += 0.02;
  if (location.includes('remote')) adjustmentFactor += 0.05;
  if (projectType === 'industrial') adjustmentFactor += 0.02;

  const optimizedSteelPerSqftMin = roundToTwo(ruleBasedResult.steelPerSqft.min * clamp(adjustmentFactor - 0.05, 0.9, 1.15));
  const optimizedSteelPerSqftMax = roundToTwo(ruleBasedResult.steelPerSqft.max * clamp(adjustmentFactor + 0.05, 0.95, 1.2));

  const optimizedTotalSteelKg = {
    min: roundToTwo(toNumber(input.area) * optimizedSteelPerSqftMin),
    max: roundToTwo(toNumber(input.area) * optimizedSteelPerSqftMax),
    unit: 'kg',
  };

  const optimizedCostRangeInr = {
    min: roundToTwo(optimizedTotalSteelKg.min * ruleBasedResult.costPerKg.min),
    max: roundToTwo(optimizedTotalSteelKg.max * ruleBasedResult.costPerKg.max),
    unit: 'INR',
  };

  const explanationParts = [
    `Adjusted for ${projectType || 'the project'} EPC requirements.`,
    heightValue > 0 ? `Height ${heightValue} m suggests a practical allowance for extra steel.` : '',
    location ? `Location considerations for ${input.location} were included.` : '',
    'This is a provisional optimization and should be validated with structural design criteria.',
  ].filter(Boolean);

  return {
    optimizedRange: {
      steelPerSqft: {
        min: optimizedSteelPerSqftMin,
        max: optimizedSteelPerSqftMax,
        unit: 'kg/sqft',
      },
      totalSteelKg: optimizedTotalSteelKg,
      costPerKg: { ...ruleBasedResult.costPerKg },
      costRangeInr: optimizedCostRangeInr,
    },
    explanation: explanationParts.join(' '),
    usedAi: false,
  };
};

const parseJsonResponse = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;

  const trimmed = rawText.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const directJsonMatch = candidate.match(/\{[\s\S]*\}/);

  const jsonText = directJsonMatch ? directJsonMatch[0] : candidate;

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    return null;
  }
};

const normalizeAiSuggestion = ({ input, ruleBasedResult, parsed }) => {
  if (!parsed || typeof parsed !== 'object') {
    return buildAdjustedFallback({ input, ruleBasedResult });
  }

  const optimizedRange = parsed.optimizedRange || parsed.optimized_range || {};
  const steelPerSqft = optimizedRange.steelPerSqft || optimizedRange.steel_per_sqft || {};
  const totalSteelKg = optimizedRange.totalSteelKg || optimizedRange.total_steel_kg || {};
  const costPerKg = optimizedRange.costPerKg || optimizedRange.cost_per_kg || {};
  const costRangeInr = optimizedRange.costRangeInr || optimizedRange.cost_range_inr || {};
  const explanation = String(parsed.explanation || parsed.summary || parsed.reasoning || '').trim();

  const normalizedSteelPerSqftMin = roundToTwo(
    clamp(
      toNumber(steelPerSqft.min ?? steelPerSqft.low ?? ruleBasedResult.steelPerSqft.min),
      ruleBasedResult.steelPerSqft.min * 0.75,
      ruleBasedResult.steelPerSqft.max * 1.35
    )
  );
  const normalizedSteelPerSqftMax = roundToTwo(
    clamp(
      toNumber(steelPerSqft.max ?? steelPerSqft.high ?? ruleBasedResult.steelPerSqft.max),
      normalizedSteelPerSqftMin,
      ruleBasedResult.steelPerSqft.max * 1.5
    )
  );

  const normalizedTotalSteelKgMin = roundToTwo(
    clamp(
      toNumber(totalSteelKg.min ?? totalSteelKg.low ?? input.area * normalizedSteelPerSqftMin),
      input.area * ruleBasedResult.steelPerSqft.min * 0.7,
      input.area * ruleBasedResult.steelPerSqft.max * 1.5
    )
  );
  const normalizedTotalSteelKgMax = roundToTwo(
    clamp(
      toNumber(totalSteelKg.max ?? totalSteelKg.high ?? input.area * normalizedSteelPerSqftMax),
      normalizedTotalSteelKgMin,
      input.area * ruleBasedResult.steelPerSqft.max * 1.7
    )
  );

  const normalizedCostPerKgMin = roundToTwo(
    clamp(
      toNumber(costPerKg.min ?? costPerKg.low ?? ruleBasedResult.costPerKg.min),
      60,
      120
    )
  );
  const normalizedCostPerKgMax = roundToTwo(
    clamp(
      toNumber(costPerKg.max ?? costPerKg.high ?? ruleBasedResult.costPerKg.max),
      normalizedCostPerKgMin,
      140
    )
  );

  const normalizedCostRangeMin = roundToTwo(
    clamp(
      toNumber(costRangeInr.min ?? costRangeInr.low ?? normalizedTotalSteelKgMin * normalizedCostPerKgMin),
      normalizedTotalSteelKgMin * 60,
      normalizedTotalSteelKgMax * 140
    )
  );
  const normalizedCostRangeMax = roundToTwo(
    clamp(
      toNumber(costRangeInr.max ?? costRangeInr.high ?? normalizedTotalSteelKgMax * normalizedCostPerKgMax),
      normalizedCostRangeMin,
      normalizedTotalSteelKgMax * 140
    )
  );

  return {
    optimizedRange: {
      steelPerSqft: {
        min: normalizedSteelPerSqftMin,
        max: normalizedSteelPerSqftMax,
        unit: 'kg/sqft',
      },
      totalSteelKg: {
        min: normalizedTotalSteelKgMin,
        max: normalizedTotalSteelKgMax,
        unit: 'kg',
      },
      costPerKg: {
        min: normalizedCostPerKgMin,
        max: normalizedCostPerKgMax,
        unit: 'INR/kg',
      },
      costRangeInr: {
        min: normalizedCostRangeMin,
        max: normalizedCostRangeMax,
        unit: 'INR',
      },
    },
    explanation:
      explanation ||
      'The AI suggestion refined the rule-based estimate using typical EPC project context in India.',
    usedAi: true,
  };
};

const buildPrompt = ({ input, ruleBasedResult }) => [
  'Given project details, suggest realistic steel consumption and cost range for EPC structure in India.',
  'Return ONLY valid JSON with this structure:',
  '{',
  '  "optimizedRange": {',
  '    "steelPerSqft": { "min": number, "max": number, "unit": "kg/sqft" },',
  '    "totalSteelKg": { "min": number, "max": number, "unit": "kg" },',
  '    "costPerKg": { "min": number, "max": number, "unit": "INR/kg" },',
  '    "costRangeInr": { "min": number, "max": number, "unit": "INR" }',
  '  },',
  '  "explanation": "string"',
  '}',
  'Keep the range realistic and explain the main reasons in one or two concise sentences.',
  `Project type: ${input.projectType}`,
  `Area: ${input.area} sqft`,
  `Height: ${input.height} m`,
  `Location: ${input.location}`,
  `Rule-based steel range: ${ruleBasedResult.steelPerSqft.min} to ${ruleBasedResult.steelPerSqft.max} kg/sqft`,
  `Rule-based steel total: ${ruleBasedResult.totalSteelKg.min} to ${ruleBasedResult.totalSteelKg.max} kg`,
  `Rule-based cost range: INR ${ruleBasedResult.costRangeInr.min} to INR ${ruleBasedResult.costRangeInr.max}`,
].join('\n');

const getOpenAiSuggestion = async ({ input, ruleBasedResult }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !OpenAI) {
    return buildAdjustedFallback({ input, ruleBasedResult });
  }

  try {
    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model: DEFAULT_MODEL,
      input: buildPrompt({ input, ruleBasedResult }),
    });

    const parsed = parseJsonResponse(response.output_text || '');
    return normalizeAiSuggestion({ input, ruleBasedResult, parsed });
  } catch (error) {
    return buildAdjustedFallback({ input, ruleBasedResult });
  }
};

const calculateAIEstimate = async (rawInput = {}) => {
  const input = {
    projectType: String(rawInput.projectType || '').trim() || 'warehouse',
    area: Math.max(0, toNumber(rawInput.area)),
    height: Math.max(0, toNumber(rawInput.height)),
    location: String(rawInput.location || '').trim() || 'India',
  };

  if (!input.area) {
    const error = new Error('Area is required for AI estimation');
    error.name = 'ValidationError';
    error.statusCode = 400;
    throw error;
  }

  const ruleBasedResult = buildRuleBasedResult(input);
  const aiSuggestion = await getOpenAiSuggestion({ input, ruleBasedResult });

  return {
    input,
    ruleBasedResult,
    aiAdjustedSuggestion: aiSuggestion,
    explanation: aiSuggestion.explanation,
    meta: {
      engineVersion: 'ai-estimate-v1',
      model: DEFAULT_MODEL,
      usedAi: Boolean(aiSuggestion.usedAi),
    },
  };
};

module.exports = {
  calculateAIEstimate,
  buildRuleBasedResult,
  buildAdjustedFallback,
  normalizeAiSuggestion,
};
