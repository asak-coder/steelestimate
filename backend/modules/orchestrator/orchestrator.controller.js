const AppError = require('../../utils/appError');
const { orchestrateEstimate } = require('./orchestrator.service');

const runOrchestrator = async (req, res, next) => {
  try {
    const input = req.body || {};
    const userId = req.user?.id || req.user?._id || null;

    if (!input || typeof input !== 'object') {
      throw new AppError('Invalid request body', 400);
    }

    const result = await orchestrateEstimate({
      input,
      userId
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  runOrchestrator
};