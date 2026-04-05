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

const buildFallbackQuotation = ({ input, calc, boq, cost }) => {
    const craneText = input.crane
        ? `The building is planned with crane provision${typeof input.craneCapacity === 'number' ? ` up to ${input.craneCapacity} MT` : ''}, and the structural design basis reflects this loading consideration.`
        : 'The building is planned without crane provision, allowing an efficient and economical structural arrangement.';

    return [
        'PROPOSAL OVERVIEW',
        `A K ENGINEERING is pleased to submit this budgetary quotation for a Pre-Engineered Building project at ${input.location}. The proposed building size is ${formatNumber(input.length)} m (L) x ${formatNumber(input.width)} m (W) x ${formatNumber(input.height)} m (H), covering approximately ${formatNumber(calc.areaSqm)} square metres (${formatNumber(calc.areaSqft)} square feet). Based on the preliminary design parameters, the estimated primary structural steel requirement is ${formatNumber(calc.estimatedSteelWeightKg)} kg.`,
        '',
        'SCOPE OF WORK',
        `Our indicative scope covers design assumptions for the PEB structural system, fabrication planning for primary and secondary steel members, and roof sheeting quantities in line with the preliminary bill of quantities. The current estimate includes primary steel of ${formatNumber(boq.primarySteelKg)} kg, secondary steel of ${formatNumber(boq.secondarySteelKg)} kg, and roof sheeting area of ${formatNumber(boq.roofSheetingSqm)} square metres. ${craneText}`,
        '',
        'COMMERCIAL NOTE',
        `Based on the above inputs, the estimated project value is INR ${formatNumber(cost.grandTotal)}, working out to approximately INR ${formatNumber(cost.costPerSqft)} per square foot. This quotation is preliminary and intended for budgeting purposes only. Final pricing shall depend on approved drawings, design criteria, site conditions, material specifications, taxes, freight, erection scope, and commercial terms prevailing at the time of order confirmation.`,
        '',
        'We look forward to the opportunity to support your project with a reliable and efficient steel building solution.'
    ].join('\n');
};

const generateQuotationText = async ({ input, calc, boq, cost }) => {
    const fallbackQuotation = buildFallbackQuotation({ input, calc, boq, cost });
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return fallbackQuotation;
    }

    try {
        const client = new OpenAI({ apiKey });

        const prompt = [
            'Create a professional industrial quotation for a pre-engineered building project.',
            'Write in clear business English.',
            'Include these sections with headings: Proposal Overview, Scope of Work, Commercial Note.',
            'Keep it concise, formal, and client-facing.',
            'Do not use markdown bullets unless necessary.',
            `Project location: ${input.location}`,
            `Building dimensions: Length ${input.length} m, Width ${input.width} m, Height ${input.height} m`,
            `Crane required: ${input.crane ? 'Yes' : 'No'}`,
            `Crane capacity: ${typeof input.craneCapacity === 'number' ? `${input.craneCapacity} MT` : 'N/A'}`,
            `Area: ${calc.areaSqm} sqm / ${calc.areaSqft} sqft`,
            `Estimated steel weight: ${calc.estimatedSteelWeightKg} kg`,
            `Primary steel: ${boq.primarySteelKg} kg`,
            `Secondary steel: ${boq.secondarySteelKg} kg`,
            `Roof sheeting: ${boq.roofSheetingSqm} sqm`,
            `Estimated total cost: INR ${cost.grandTotal}`,
            `Estimated cost per sqft: INR ${cost.costPerSqft}`,
            'Avoid unsupported promises, legal wording, or detailed exclusions.',
            'End with a short professional closing sentence.'
        ].join('\n');

        const response = await client.responses.create({
            model: DEFAULT_MODEL,
            input: prompt
        });

        const quotationText = response.output_text ? response.output_text.trim() : '';

        return quotationText || fallbackQuotation;
    } catch (error) {
        return fallbackQuotation;
    }
};

module.exports = {
    generateQuotationText
};