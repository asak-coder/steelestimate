const OpenAI = require('openai');

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

const normalizeAiResult = ({ baseCost, projectSize, location, responseText, fallback }) => {
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

    if (!apiKey) {
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
            baseCost: normalizedBaseCost,
            projectSize: normalizedProjectSize,
            location: normalizedLocation,
            responseText,
            fallback
        });
    } catch (error) {
        return fallback;
    }
};

module.exports = {
    optimizePricing
};