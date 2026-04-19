const AppError = require('../../utils/appError');

const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

const runAgent4 = async ({ input, structured, engineering, cost }) => {
  if (!input || !structured || !engineering || !cost) {
    throw new AppError('Agent4 requires complete orchestration context', 400);
  }

  const riskFactors = [];

  if (Boolean(input.hazard)) riskFactors.push(14);
  if (Boolean(input.shutdown)) riskFactors.push(9);
  if (Boolean(input.nightShift)) riskFactors.push(6);
  if (Number(input.height || 0) > 18) riskFactors.push(10);
  if (Number(input.tonnage || 0) > 100) riskFactors.push(8);
  if (String(input.locationType || '').toLowerCase() === 'remote') riskFactors.push(7);

  const riskScore = roundToTwo(Math.min(100, 28 + riskFactors.reduce((sum, item) => sum + item, 0)));
  const lossFactor = roundToTwo(0.04 + (riskScore / 100) * 0.08);
  const lossAmount = roundToTwo(Number(cost.baseCost || 0) * lossFactor);

  return {
    riskScore,
    riskLevel: riskScore >= 70 ? 'high' : riskScore >= 45 ? 'medium' : 'low',
    lossFactor,
    lossAmount,
    riskDrivers: [
      ...(Boolean(input.hazard) ? ['hazardous site'] : []),
      ...(Boolean(input.shutdown) ? ['shutdown constraint'] : []),
      ...(Boolean(input.nightShift) ? ['night shift execution'] : []),
      ...(Number(input.height || 0) > 18 ? ['high erection height'] : []),
      ...(Number(input.tonnage || 0) > 100 ? ['heavy tonnage logistics'] : []),
      ...(String(input.locationType || '').toLowerCase() === 'remote' ? ['remote location'] : [])
    ],
    contingencyRecommendation: roundToTwo(lossAmount * 0.35)
  };
};

module.exports = {
  runAgent4
};