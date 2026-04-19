const { validateObjectId } = require('../../middleware/validation');
const LearningData = require('../../models/LearningData');
const Estimate = require('../../models/Estimate');
const { generateLearningInsights } = require('../agents/agent8.learning');

function buildQueryFilters(query = {}) {
  const filters = {};
  if (query.projectType) {
    filters.projectType = String(query.projectType).trim();
  }
  if (query.clientType) {
    filters.clientType = String(query.clientType).trim();
  }
  if (query.region) {
    filters.region = String(query.region).trim();
  }
  if (query.fromDate) {
    filters.fromDate = query.fromDate;
  }
  if (query.toDate) {
    filters.toDate = query.toDate;
  }
  return filters;
}

async function getLearningInsights(req, res, next) {
  try {
    const filters = buildQueryFilters(req.query);
    const insights = await generateLearningInsights({
      LearningData,
      Estimate,
      filters
    });

    res.json({
      success: true,
      data: {
        patterns: insights.patterns,
        costAccuracy: insights.costAccuracy,
        lossInsights: insights.lossInsights,
        recommendedMarginAdjustments: insights.recommendedMarginAdjustments,
        highRiskConditions: insights.highRiskConditions,
        summary: insights.summary
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLearningInsights
};