const ApiKey = require('../models/ApiKey');
const AppError = require('../utils/appError');

const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
      throw new AppError('x-api-key header is required', 401);
    }

    const apiKeyDoc = await ApiKey.findOne({ apiKey });

    if (!apiKeyDoc) {
      throw new AppError('Invalid API key', 401);
    }

    apiKeyDoc.resetUsageIfNeeded();

    const limit = apiKeyDoc.plan === 'premium' ? Infinity : apiKeyDoc.usageLimit;

    if (apiKeyDoc.usedRequests >= limit) {
      return res.status(429).json({
        success: false,
        message: 'API limit exceeded'
      });
    }

    apiKeyDoc.usedRequests += 1;
    await apiKeyDoc.save();

    req.apiUser = apiKeyDoc;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = apiKeyAuth;
