let OpenAI;
try {
    OpenAI = require('openai');
} catch (error) {
    OpenAI = null;
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const roundToTwo = (value) => Math.round(value * 100) / 100;

const formatNumber = (value) => {
    const numericValue = typeof value === 'number' ? value : Number(value || 0);

    return roundToTwo(numericValue).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const getLocationFactor = (location) => {
    const text = String(location || '').toLowerCase();

    if (/(metro|mumbai|delhi|bengaluru|bangalore|chennai|hyderabad|pune|kolkata|ahmedabad|surat|noida|gurgaon|gurugram)/i.test(text)) {
        return 1.14;
    }

    if (/(industrial|plant|factory|warehouse|godown|sipcot|midc|estate|park|zone)/i.test(text)) {
        return 1.1;
    }

    if (/(city|urban|town|municipal|corporation)/i.test(text)) {
        return 1.08;
    }

    if (/(village|rural|taluk|taluka|district|suburban|semiurban)/i.test(text)) {
        return 0.98;
    }

    return 1.0;
};

const getSizeFactor = (projectSize) => {
    const size = Number(projectSize || 0);

    if (size >= 20000) {
        return 0.92;
    }

    if (size >= 10000) {
        return 0.95;
    }

    if (size >= 5000) {
        return 0.98;
    }

    if (size >= 2500) {
        return 1.02;
    }

    return 1.06;
};

const buildFallbackResult = ({ baseCost, projectSize, location, locationFactor, sizeFactor, targetMargin }) => {
    const markupFactor = 1 + targetMargin / 100;
    const optimizedPrice = roundToTwo(Math.max(0, baseCost) * locationFactor * sizeFactor * markupFactor);
    const marginPercent = roundToTwo(targetMargin);
    const baseText = formatNumber(baseCost);
    const priceText = formatNumber(optimizedPrice);

    const justificationText = [
        `The optimized price is calibrated from the base cost of INR ${baseText} using project size and location sensitivity.`,
        `The project size of ${formatNumber(projectSize)} sqm applies a size factor of ${roundToTwo(sizeFactor)} and the location "${location}" applies a factor of ${roundToTwo(locationFactor)}.`,
        `A target margin of ${marginPercent}% has been selected to keep the offer competitive while protecting execution risk and commercial viability.`
    ].join(' ');

    const whyThisPriceIsOptimal = [
        `This price balances win probability and margin protection for the given project profile.`,
        `It stays aligned with the cost base, while modestly adjusting for the market strength implied by the project location and scale.`,
        `The resulting offer of INR ${priceText} is a safe, deterministic recommendation when AI output is unavailable.`
    ].join(' ');

    return {
        optimizedPrice,
        marginPercent,
        justificationText,
        whyThisPriceIsOptimal
    };
};

const parseAiResponse = (text) => {
    const raw = String(text || '').trim();

    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);

        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
    } catch (error) {
        return null;
    }

    return null;
};

const normalizeAiResult = ({ responseText, fallback }) => {
    const parsed = parseAiResponse(responseText);

    if (!parsed) {
        return fallback;
    }

    const optimizedPrice = Number(parsed.optimizedPrice);
    const marginPercent = Number(parsed.marginPercent);

    if (!Number.isFinite(optimizedPrice) || !Number.isFinite(marginPercent)) {
        return fallback;
    }

    return {
        optimizedPrice: roundToTwo(Math.max(0, optimizedPrice)),
        marginPercent: roundToTwo(marginPercent),
        justificationText: String(parsed.justificationText || fallback.justificationText),
        whyThisPriceIsOptimal: String(parsed.whyThisPriceIsOptimal || fallback.whyThisPriceIsOptimal)
    };
};

const optimizePricing = async ({ baseCost, projectSize, location }) => {
    const normalizedBaseCost = Math.max(0, Number(baseCost || 0));
    const normalizedProjectSize = Math.max(0, Number(projectSize || 0));
    const normalizedLocation = String(location || 'Unknown').trim() || 'Unknown';

    const locationFactor = getLocationFactor(normalizedLocation);
    const sizeFactor = getSizeFactor(normalizedProjectSize);
    const targetMargin = Math.min(28, Math.max(12, 18 + (normalizedProjectSize >= 10000 ? 3 : 0) + (locationFactor > 1.1 ? 2 : 0)));

    const fallback = buildFallbackResult({
        baseCost: normalizedBaseCost,
        projectSize: normalizedProjectSize,
        location: normalizedLocation,
        locationFactor,
        sizeFactor,
        targetMargin
    });

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || !OpenAI) {
        return fallback;
    }

    try {
        const client = new OpenAI({ apiKey });

        const prompt = [
            'You are a commercial pricing optimizer for an engineering services business.',
            'Return ONLY valid JSON with these keys: optimizedPrice, marginPercent, justificationText, whyThisPriceIsOptimal.',
            'Keep justification concise, professional, and client-facing.',
            'Use numbers only for optimizedPrice and marginPercent.',
            `Base cost: INR ${formatNumber(normalizedBaseCost)}`,
            `Project size: ${formatNumber(normalizedProjectSize)} sqm`,
            `Location: ${normalizedLocation}`,
            `Suggested location factor: ${roundToTwo(locationFactor)}`,
            `Suggested size factor: ${roundToTwo(sizeFactor)}`,
            `Suggested target margin: ${roundToTwo(targetMargin)}%`,
            'Do not include markdown, code fences, or extra commentary.'
        ].join('\n');

        const response = await client.responses.create({
            model: DEFAULT_MODEL,
            input: prompt
        });

        const responseText = response.output_text ? response.output_text.trim() : '';

        return normalizeAiResult({
            responseText,
            fallback
        });
    } catch (error) {
        return fallback;
    }
};

const normalizeRateEntries = (entries) => {
    if (!Array.isArray(entries)) {
        return [];
    }

    return entries
        .map((entry) => {
            if (typeof entry === 'number') {
                return { rate: entry, outcome: null };
            }

            if (!entry || typeof entry !== 'object') {
                return null;
            }

            const rate = Number(entry.rate ?? entry.value ?? entry.amount ?? entry.actualRate ?? entry.historicalRate);
            if (!Number.isFinite(rate)) {
                return null;
            }

            return {
                rate,
                outcome: String(entry.outcome || entry.projectOutcome || entry.result || '').toLowerCase(),
                margin: Number(entry.margin ?? entry.actualMargin ?? entry.profitMargin),
                loss: Number(entry.loss ?? entry.lossAmount ?? 0),
                projectType: String(entry.projectType || '').toLowerCase()
            };
        })
        .filter(Boolean);
};

const normalizeTrend = (marketTrend) => {
    const raw = String(marketTrend || '').trim().toLowerCase();

    if (!raw) {
        return 'stable';
    }

    if (/(bull|rising|increasing|up|strong|tight)/.test(raw)) {
        return 'rising';
    }

    if (/(bear|falling|decreasing|down|soft|weak)/.test(raw)) {
        return 'falling';
    }

    return 'stable';
};

const calculateRateIntelligence = ({ rateType, historicalRates, projectOutcomes, marketTrend }) => {
    const normalizedRateType = String(rateType || 'rate').trim() || 'rate';
    const trend = normalizeTrend(marketTrend);
    const rates = normalizeRateEntries(historicalRates);
    const outcomes = Array.isArray(projectOutcomes) ? projectOutcomes : [];

    if (!rates.length) {
        return {
            recommendedRateRange: { min: 0, max: 0 },
            adjustmentReason: `No historical ${normalizedRateType} data available. Use conservative pricing controls until outcome history is captured.`,
            riskLevel: 'high'
        };
    }

    const numericRates = rates.map((entry) => entry.rate).filter((value) => Number.isFinite(value) && value > 0);
    const sortedRates = numericRates.slice().sort((a, b) => a - b);

    const outcomeRows = outcomes
        .map((entry) => {
            if (!entry || typeof entry !== 'object') {
                return null;
            }

            const rate = Number(entry.rate ?? entry.value ?? entry.amount ?? entry.actualRate ?? entry.historicalRate);
            if (!Number.isFinite(rate)) {
                return null;
            }

            return {
                rate,
                projectOutcome: String(entry.projectOutcome || entry.outcome || '').toLowerCase(),
                margin: Number(entry.margin ?? entry.actualMargin ?? entry.profitMargin),
                loss: Number(entry.loss ?? entry.lossAmount ?? 0)
            };
        })
        .filter(Boolean);

    const losses = outcomeRows.filter((entry) => /(loss|failed|unprofitable|bad)/.test(entry.projectOutcome));
    const wins = outcomeRows.filter((entry) => /(win|profit|successful|good|safe)/.test(entry.projectOutcome));

    const avgRate = numericRates.reduce((sum, value) => sum + value, 0) / numericRates.length;
    const medianRate = sortedRates[Math.floor(sortedRates.length / 2)] || avgRate;
    const minRate = sortedRates[0];
    const maxRate = sortedRates[sortedRates.length - 1];
    const spread = maxRate - minRate;
    const volatility = avgRate ? spread / avgRate : 0;

    const lossRates = losses.map((entry) => entry.rate).filter((value) => Number.isFinite(value) && value > 0);
    const winRates = wins.map((entry) => entry.rate).filter((value) => Number.isFinite(value) && value > 0);

    const avgLossRate = lossRates.length
        ? lossRates.reduce((sum, value) => sum + value, 0) / lossRates.length
        : null;
    const avgWinRate = winRates.length
        ? winRates.reduce((sum, value) => sum + value, 0) / winRates.length
        : null;

    let baseRecommendation = medianRate;

    if (Number.isFinite(avgLossRate) && Number.isFinite(avgWinRate)) {
        baseRecommendation = (avgLossRate + avgWinRate) / 2;
    } else if (Number.isFinite(avgLossRate)) {
        baseRecommendation = avgLossRate;
    } else if (Number.isFinite(avgWinRate)) {
        baseRecommendation = avgWinRate;
    }

    const trendAdjustment = trend === 'rising' ? 0.03 : trend === 'falling' ? -0.03 : 0;
    const performanceAdjustment = losses.length > wins.length ? 0.02 : wins.length > losses.length ? -0.01 : 0;
    const volatilityBuffer = Math.min(0.08, Math.max(0.02, volatility * 0.35));
    const safeFloor = Number.isFinite(minRate) ? minRate : baseRecommendation * 0.9;
    const safeCeiling = Number.isFinite(maxRate) ? maxRate : baseRecommendation * 1.1;

    const adjustedTarget = baseRecommendation * (1 + trendAdjustment + performanceAdjustment);
    const recommendedCenter = Math.max(safeFloor, adjustedTarget);
    const rangeMin = roundToTwo(Math.max(safeFloor, recommendedCenter * (1 - volatilityBuffer)));
    const rangeMax = roundToTwo(Math.max(rangeMin, Math.min(safeCeiling * (1 + volatilityBuffer / 2), recommendedCenter * (1 + volatilityBuffer))));

    const lossPressure = losses.length ? `Historical ${normalizedRateType} losses occurred in ${losses.length} of ${outcomeRows.length || losses.length} tracked outcomes.` : `No loss-heavy outcomes were present in the tracked ${normalizedRateType} history.`;
    const trendText = trend === 'rising'
        ? 'Market trend is rising, so the recommendation follows the market with a controlled uplift.'
        : trend === 'falling'
            ? 'Market trend is softening, so the recommendation stays disciplined and avoids aggressive pricing.'
            : 'Market trend is stable, so the recommendation remains anchored to historical safe rates.';

    const volatilityText = volatility >= 0.2
        ? 'High rate volatility requires a wider safety buffer to avoid underpricing during execution risk.'
        : volatility >= 0.1
            ? 'Moderate volatility justifies a measured buffer to protect margin without losing competitiveness.'
            : 'Low volatility allows a tighter band around the safe historical rate range.';

    const riskLevel = (() => {
        if (volatility >= 0.2 || losses.length > wins.length * 1.5) {
            return 'high';
        }

        if (volatility >= 0.1 || losses.length >= wins.length) {
            return 'medium';
        }

        return 'low';
    })();

    const adjustmentReason = [
        `Historical ${normalizedRateType} data centers around ${roundToTwo(baseRecommendation)} with a safe band from ${roundToTwo(safeFloor)} to ${roundToTwo(safeCeiling)}.`,
        lossPressure,
        trendText,
        volatilityText,
        `A volatility buffer of ${roundToTwo(volatilityBuffer * 100)}% has been applied to keep the range conservative and avoid aggressive underpricing.`
    ].join(' ');

    return {
        recommendedRateRange: {
            min: rangeMin,
            max: rangeMax
        },
        adjustmentReason,
        riskLevel
    };
};

module.exports = {
    optimizePricing,
    calculateRateIntelligence
};