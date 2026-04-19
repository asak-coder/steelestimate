const mongoose = require('mongoose');

function toObjectId(value) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
}

function roundNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value)) || !Number.isFinite(Number(value))) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(Number(value) * factor) / factor;
}

function safeDivide(numerator, denominator, fallback = 0) {
  if (!denominator) {
    return fallback;
  }
  return numerator / denominator;
}

function buildMonthlyTrend(records, keySelector) {
  const buckets = new Map();

  records.forEach((record) => {
    const date = record.createdAt || record.updatedAt || record.created_date || record.date;
    if (!date) {
      return;
    }
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) {
      return;
    }
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const current = buckets.get(month) || { month, count: 0, total: 0 };
    current.count += 1;
    current.total += Number(keySelector(record) || 0);
    buckets.set(month, current);
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      month: item.month,
      count: item.count,
      average: roundNumber(safeDivide(item.total, item.count, 0))
    }));
}

function analyzeLearningData(learningData = [], estimates = []) {
  const validLearningData = Array.isArray(learningData) ? learningData : [];
  const validEstimates = Array.isArray(estimates) ? estimates : [];

  const patternMap = new Map();
  const lossInsights = [];
  const recommendedMarginAdjustments = [];
  const highRiskConditions = [];

  let totalAccuracy = 0;
  let accuracyCount = 0;
  let totalMarginVariance = 0;
  let varianceCount = 0;
  let lossCount = 0;

  validLearningData.forEach((item) => {
    const conditionKey = [
      item.projectType || 'Unknown',
      item.clientType || 'Unknown',
      item.region || 'Unknown'
    ].join(' | ');

    const current = patternMap.get(conditionKey) || {
      conditionKey,
      projectType: item.projectType || 'Unknown',
      clientType: item.clientType || 'Unknown',
      region: item.region || 'Unknown',
      samples: 0,
      avgAccuracy: 0,
      avgMarginVariance: 0,
      lossRate: 0,
      highRisk: false
    };

    const accuracy = Number(item.costAccuracy ?? item.accuracy ?? 0);
    const marginVariance = Number(item.marginVariance ?? item.variance ?? 0);
    const isLoss = Boolean(item.isLoss || item.loss || marginVariance < 0);

    current.samples += 1;
    current.avgAccuracy += accuracy;
    current.avgMarginVariance += marginVariance;
    current.lossRate += isLoss ? 1 : 0;
    current.highRisk = current.highRisk || isLoss || accuracy < 0.85 || marginVariance < 0;

    totalAccuracy += accuracy;
    accuracyCount += 1;
    totalMarginVariance += marginVariance;
    varianceCount += 1;
    if (isLoss) {
      lossCount += 1;
    }

    patternMap.set(conditionKey, current);
  });

  const patterns = Array.from(patternMap.values()).map((item) => ({
    ...item,
    avgAccuracy: roundNumber(safeDivide(item.avgAccuracy, item.samples, 0)),
    avgMarginVariance: roundNumber(safeDivide(item.avgMarginVariance, item.samples, 0)),
    lossRate: roundNumber(safeDivide(item.lossRate, item.samples, 0))
  }));

  patterns.sort((a, b) => b.samples - a.samples);

  const avgCostAccuracy = roundNumber(safeDivide(totalAccuracy, accuracyCount, 0));
  const avgMarginVariance = roundNumber(safeDivide(totalMarginVariance, varianceCount, 0));
  const lossRate = roundNumber(safeDivide(lossCount, validLearningData.length, 0));

  const accuracyBands = {
    strong: validLearningData.filter((item) => Number(item.costAccuracy ?? item.accuracy ?? 0) >= 0.9).length,
    moderate: validLearningData.filter((item) => {
      const accuracy = Number(item.costAccuracy ?? item.accuracy ?? 0);
      return accuracy >= 0.8 && accuracy < 0.9;
    }).length,
    weak: validLearningData.filter((item) => Number(item.costAccuracy ?? item.accuracy ?? 0) < 0.8).length
  };

  const lossByClientType = new Map();
  validLearningData.forEach((item) => {
    const clientType = item.clientType || 'Unknown';
    const entry = lossByClientType.get(clientType) || { clientType, total: 0, losses: 0 };
    entry.total += 1;
    if (Boolean(item.isLoss || item.loss || Number(item.marginVariance ?? item.variance ?? 0) < 0)) {
      entry.losses += 1;
    }
    lossByClientType.set(clientType, entry);
  });

  const lossBreakdown = Array.from(lossByClientType.values())
    .map((entry) => ({
      clientType: entry.clientType,
      lossRate: roundNumber(safeDivide(entry.losses, entry.total, 0))
    }))
    .sort((a, b) => b.lossRate - a.lossRate);

  const averageMarginVariance = roundNumber(avgMarginVariance);
  if (lossBreakdown.length) {
    lossInsights.push({
      type: 'clientTypeLoss',
      details: lossBreakdown
    });
  }

  if (patterns.length) {
    const weakest = patterns.filter((item) => item.avgAccuracy < 0.85 || item.lossRate > 0.2);
    if (weakest.length) {
      lossInsights.push({
        type: 'weakPatterns',
        details: weakest.slice(0, 5)
      });
    }
  }

  if (averageMarginVariance < 0) {
    recommendedMarginAdjustments.push({
      condition: 'Overall negative margin variance',
      recommendation: 'Increase contingency and margin thresholds on future estimates',
      suggestedAdjustmentPct: roundNumber(Math.abs(averageMarginVariance) * 100)
    });
  }

  patterns
    .filter((item) => item.avgMarginVariance < 0 || item.lossRate > 0.15)
    .slice(0, 5)
    .forEach((item) => {
      recommendedMarginAdjustments.push({
        condition: `${item.projectType} / ${item.clientType} / ${item.region}`,
        recommendation: 'Review pricing, assumptions, and risk buffer for this segment',
        suggestedAdjustmentPct: roundNumber(Math.max(5, Math.abs(item.avgMarginVariance) * 100))
      });
    });

  patterns
    .filter((item) => item.highRisk)
    .slice(0, 10)
    .forEach((item) => {
      highRiskConditions.push({
        projectType: item.projectType,
        clientType: item.clientType,
        region: item.region,
        samples: item.samples,
        riskScore: roundNumber((1 - item.avgAccuracy) + item.lossRate)
      });
    });

  const estimatesSummary = {
    total: validEstimates.length,
    avgMargin: roundNumber(
      safeDivide(
        validEstimates.reduce((sum, estimate) => sum + Number(estimate.margin ?? estimate.profitMargin ?? 0), 0),
        validEstimates.length,
        0
      )
    ),
    avgEstimateValue: roundNumber(
      safeDivide(
        validEstimates.reduce((sum, estimate) => sum + Number(estimate.total ?? estimate.estimateTotal ?? estimate.amount ?? 0), 0),
        validEstimates.length,
        0
      )
    ),
    highRiskCount: validEstimates.filter((estimate) => Boolean(estimate.isHighRisk || estimate.highRisk)).length,
    monthlyTrend: buildMonthlyTrend(validEstimates, (estimate) => Number(estimate.total ?? estimate.estimateTotal ?? estimate.amount ?? 0)),
    marginTrend: buildMonthlyTrend(validEstimates, (estimate) => Number(estimate.margin ?? estimate.profitMargin ?? 0))
  };

  const summary = [
    `${validLearningData.length} learning records analyzed`,
    `${patterns.length} pattern groups identified`,
    `${lossRate * 100}% overall loss rate`,
    `${avgCostAccuracy * 100}% average cost accuracy`
  ].join('. ');

  return {
    patterns,
    costAccuracy: {
      avgCostAccuracy,
      accuracyBands,
      sampleSize: validLearningData.length
    },
    lossInsights,
    recommendedMarginAdjustments,
    highRiskConditions,
    summary,
    estimatesSummary
  };
}

async function generateLearningInsights({ LearningData, Estimate, filters = {} }) {
  const learningQuery = {};
  const estimateQuery = {};

  const projectType = filters.projectType ? String(filters.projectType).trim() : '';
  const clientType = filters.clientType ? String(filters.clientType).trim() : '';
  const region = filters.region ? String(filters.region).trim() : '';
  const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
  const toDate = filters.toDate ? new Date(filters.toDate) : null;

  if (projectType) {
    learningQuery.projectType = projectType;
    estimateQuery.projectType = projectType;
  }
  if (clientType) {
    learningQuery.clientType = clientType;
    estimateQuery.clientType = clientType;
  }
  if (region) {
    learningQuery.region = region;
    estimateQuery.region = region;
  }
  if (fromDate && !Number.isNaN(fromDate.getTime())) {
    learningQuery.createdAt = learningQuery.createdAt || {};
    learningQuery.createdAt.$gte = fromDate;
    estimateQuery.createdAt = estimateQuery.createdAt || {};
    estimateQuery.createdAt.$gte = fromDate;
  }
  if (toDate && !Number.isNaN(toDate.getTime())) {
    learningQuery.createdAt = learningQuery.createdAt || {};
    learningQuery.createdAt.$lte = toDate;
    estimateQuery.createdAt = estimateQuery.createdAt || {};
    estimateQuery.createdAt.$lte = toDate;
  }

  const [learningData, estimates] = await Promise.all([
    LearningData.find(learningQuery).select('projectType clientType region costAccuracy accuracy marginVariance isLoss loss createdAt updatedAt').lean().exec(),
    Estimate.find(estimateQuery).select('projectType clientType region margin profitMargin total estimateTotal amount isHighRisk highRisk createdAt updatedAt').lean().exec()
  ]);

  return analyzeLearningData(learningData, estimates);
}

module.exports = {
  analyzeLearningData,
  generateLearningInsights
};