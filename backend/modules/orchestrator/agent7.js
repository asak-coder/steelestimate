const OpenAI = require('openai');

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = Number(process.env.ORCHESTRATOR_AI_TIMEOUT_MS || 12000);

const safeJsonParse = (value) => {
  try {
    const parsed = JSON.parse(String(value || '').trim());
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
};

const runAgent7 = async ({ input, commercial, cost, loss }) => {
  const fallback = {
    clientStrategy: 'value-led proposal with controlled risk',
    positioning: 'Present the offer as execution-ready, transparent, and commercially protected.',
    objections: ['Site readiness', 'Scope clarity', 'Commercial terms'],
    risks: ['Price fluctuation', 'Approval delays', 'Execution constraints'],
    recommendedPriceAnchor: Math.round((Number(commercial.recommendedPrice || cost.finalAmount || 0) || 0) * 100) / 100
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
          'You are Agent7.',
          'Return ONLY valid JSON.',
          'Recommend client strategy and objection handling for a steel estimate.',
          'Do not compute base cost or modify commercial calculations.',
          `Input: ${JSON.stringify(input)}`,
          `Commercial: ${JSON.stringify(commercial)}`,
          `Cost: ${JSON.stringify(cost)}`,
          `Loss: ${JSON.stringify(loss)}`,
          'Required keys: clientStrategy, positioning, objections, risks, recommendedPriceAnchor.'
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
      clientStrategy: String(parsed.clientStrategy || fallback.clientStrategy),
      positioning: String(parsed.positioning || fallback.positioning),
      objections: Array.isArray(parsed.objections) ? parsed.objections : fallback.objections,
      risks: Array.isArray(parsed.risks) ? parsed.risks : fallback.risks,
      recommendedPriceAnchor: Math.round((Number(parsed.recommendedPriceAnchor || fallback.recommendedPriceAnchor) || 0) * 100) / 100
    };
  } catch (error) {
    return fallback;
  }
};

module.exports = {
  runAgent7
};