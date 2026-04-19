const { generateBOQ } = require('../../services/boqService');
const { optimizePricing } = require('../../services/pricingOptimizationService');
const { generateQuotationText } = require('../../services/aiQuotationService');
const { roundToTwo, deriveProjectProfile, toNumber, clamp } = require('../agents/agentMath');

const buildDeterministicCost = (profile, boq) => {
  const steelRatePerKg = profile.hazard ? 95 : 88;
  const baseSteelCost = roundToTwo((boq.primarySteelKg + boq.secondarySteelKg) * steelRatePerKg);
  const heightPremium = roundToTwo(profile.height * 1200);
  const complexityPremium = roundToTwo(baseSteelCost * (profile.complexityFactor - 1) * 0.22);
  const contingency = roundToTwo((baseSteelCost + heightPremium + complexityPremium) * 0.08);

  const cost = roundToTwo(baseSteelCost + heightPremium + complexityPremium + contingency);

  return {
    baseSteelCost,
    heightPremium,
    complexityPremium,
    contingency,
    grandTotal: cost,
    costPerTon: profile.tonnage > 0 ? roundToTwo(cost / profile.tonnage) : 0
  };
};

const buildDeterministicLoss = (profile, cost) => {
  const exposure = profile.hazard ? 0.06 : 0.04;
  const heightImpact = clamp(profile.height / 100, 0, 0.08);
  return roundToTwo(cost.grandTotal * (exposure + heightImpact));
};

const buildDeterministicMargin = (profile) => {
  const baseMargin = profile.hazard ? 18 : 16;
  const sizeAdjustment = profile.tonnage >= 100 ? 2 : profile.tonnage >= 50 ? 1 : 0;
  const heightAdjustment = profile.height >= 20 ? 1 : 0;
  return roundToTwo(baseMargin + sizeAdjustment + heightAdjustment);
};

const buildRiskLevel = (profile) => {
  if (profile.hazard || profile.height >= 30 || profile.tonnage >= 150) {
    return 'high';
  }

  if (profile.height >= 15 || profile.tonnage >= 60) {
    return 'medium';
  }

  return 'low';
};

const buildStrategy = (profile, pricing) => {
  const strategyBase = pricing.marginPercent >= 20 ? 'value-based' : 'competitive';
  const riskModifier = profile.hazard ? 'risk-adjusted' : 'standard';
  return `${riskModifier} ${strategyBase} pricing`;
};

const buildBoq = async (input, profile) => {
  const estimatedSteelWeightKg = roundToTwo(Math.max(0, profile.tonnage * 1000 * profile.complexityFactor * 0.35));
  const areaSqm = roundToTwo(Math.max(0, toNumber(input.areaSqm, profile.tonnage * 45 + profile.height * 2)));
  const boq = await generateBOQ({
    estimatedSteelWeightKg,
    areaSqm
  });

  return {
    ...boq,
    estimatedSteelWeightKg,
    boltsKg: roundToTwo(estimatedSteelWeightKg * 0.03),
    primerKg: roundToTwo(estimatedSteelWeightKg * 0.01),
    paintKg: roundToTwo(estimatedSteelWeightKg * 0.015)
  };
};

const buildStrategyNotes = (profile, pricing, riskLevel) => {
  const notes = [
    profile.hazard ? 'Hazard controls require tighter execution buffers.' : 'Standard execution profile allows efficient delivery.',
    riskLevel === 'high' ? 'High-risk project conditions justify conservative margin protection.' : 'Commercial posture remains balanced for competitive bidding.',
    `Recommended margin anchored at ${pricing.marginPercent}% from deterministic pricing optimization.`
  ];

  return notes;
};

const orchestrateEstimationCore = async ({ input = {}, userId = null, useAi = true } = {}) => {
  const profile = deriveProjectProfile(input);
  const boq = await buildBoq(input, profile);
  const cost = buildDeterministicCost(profile, boq);
  const loss = buildDeterministicLoss(profile, cost);
  const recommendedMargin = buildDeterministicMargin(profile);
  const riskLevel = buildRiskLevel(profile);

  const pricing = await optimizePricing({
    baseCost: cost.grandTotal,
    projectSize: boq.roofSheetingSqm,
    location: input.location || profile.projectType
  });

  const finalAmount = roundToTwo(cost.grandTotal * (1 + pricing.marginPercent / 100));
  const strategy = buildStrategy(profile, pricing);
  const insights = buildStrategyNotes(profile, pricing, riskLevel);

  const quotationText = useAi
    ? await generateQuotationText({
        input,
        calc: {
          areaSqm: boq.roofSheetingSqm,
          areaSqft: roundToTwo(boq.roofSheetingSqm * 10.7639),
          estimatedSteelWeightKg: boq.estimatedSteelWeightKg
        },
        boq,
        cost
      })
    : '';

  return {
    boq,
    cost,
    loss,
    recommendedMargin,
    riskLevel,
    strategy,
    winProbability: clamp(roundToTwo(100 - (riskLevel === 'high' ? 42 : riskLevel === 'medium' ? 30 : 18) - (profile.hazard ? 6 : 0)), 5, 95),
    finalAmount,
    metadata: {
      userId,
      profile,
      pricing,
      quotationText
    },
    insights,
    quotations: {
      quotationText
    }
  };
};

module.exports = {
  orchestrateEstimationCore
};