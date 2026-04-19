const OpenAI = require('openai');

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = Number(process.env.ORCHESTRATOR_AI_TIMEOUT_MS || 12000);

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

const safeJsonParse = (value) => {
  try {
    const parsed = JSON.parse(String(value || '').trim());
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
};

const runAgent6 = async ({ input, structured, engineering, cost, loss, boq }) => {
  const fallback = {
    pricingStrategy: 'balanced',
    riskLevel: loss.riskLevel || 'medium',
    riskScore: loss.riskScore || 50,
    suggestedMargin: roundToTwo(0.18 + Math.min(0.06, Number(loss.lossFactor || 0))),
    commercialSummary: 'Commercial strategy fallback generated deterministically.',
    negotiationNotes: ['Validate scope and commercial exclusions before release.'],
    recommendedPrice: roundToTwo(Number(cost.baseCost || 0) + Number(loss.lossAmount || 0) + Number(cost.baseCost || 0) * 0.18)
  };

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await Promise.race([
      client.responses.create({
        model: DEFAULT_MODEL,
        input: [
          'You are Agent6.',
          'Return ONLY valid JSON.',
          'Recommend commercial strategy and suggested margin for this steel estimate.',
          'Do not compute base cost or alter engineering values.',
          `Input: ${JSON.stringify(input)}`,
          `Structured: ${JSON.stringify(structured)}`,
          `Engineering: ${JSON.stringify(engineering)}`,
          `Cost: ${JSON.stringify(cost)}`,
          `Loss: ${JSON.stringify(loss)}`,
          `BOQ: ${JSON.stringify(boq)}`,
          'Required keys: pricingStrategy, riskLevel, riskScore, suggestedMargin, commercialSummary, negotiationNotes, recommendedPrice.'
        ].join('\n')
      }),
      new Promise((resolve) => setTimeout(() => resolve(null), DEFAULT_TIMEOUT_MS))
    ]);

    if (!response || !response.output_text) {
      return fallback;
    }

    const parsed = safeJsonParse(response.output_text);
    if (!parsed) {
      return fallback;
    }

    return {
      pricingStrategy: String(parsed.pricingStrategy || fallback.pricingStrategy),
      riskLevel: String(parsed.riskLevel || fallback.riskLevel),
      riskScore: roundToTwo(parsed.riskScore || fallback.riskScore),
      suggestedMargin: roundToTwo(parsed.suggestedMargin || fallback.suggestedMargin),
      commercialSummary: String(parsed.commercialSummary || fallback.commercialSummary),
      negotiationNotes: Array.isArray(parsed.negotiationNotes) ? parsed.negotiationNotes : fallback.negotiationNotes,
      recommendedPrice: roundToTwo(parsed.recommendedPrice || fallback.recommendedPrice)
    };
  } catch (error) {
    return fallback;
  }
};

module.exports = {
  runAgent6
};