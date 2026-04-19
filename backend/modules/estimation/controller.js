const AppError = require('../../utils/appError');
const { createEstimateRecord } = require('./service');
const { parseEstimateCalculationInput } = require('./validation');

const sanitizeEstimate = (estimate) => ({
  id: estimate._id,
  projectType: estimate.projectType,
  inputs: estimate.inputs || {},
  assumptions: Array.isArray(estimate.assumptions) ? estimate.assumptions : [],
  results: estimate.results || {},
  warnings: Array.isArray(estimate.warnings) ? estimate.warnings : [],
  meta: {
    id: estimate._id,
    userId: estimate.userId || null,
    status: estimate.status || 'calculated',
    engineVersion: estimate.engineVersion || 'v1',
    calculationMeta: estimate.calculationMeta || {},
    createdAt: estimate.createdAt,
    updatedAt: estimate.updatedAt
  }
});

const calculateEstimate = async (req, res, next) => {
  try {
    const input = parseEstimateCalculationInput(req.body);
    const userId = req.user?.id || req.user?._id || req.body.userId;

    const { estimate, output } = await createEstimateRecord({
      userId,
      input
    });

    return res.status(201).json({
      success: true,
      data: {
        ...output,
        estimate: sanitizeEstimate(estimate)
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(new AppError(error.message, 400));
    }

    return next(error);
  }
};

module.exports = {
  calculateEstimate
};