const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const AppError = require('../utils/appError');

const buildUsageLimit = (plan) => {
  return plan === 'premium' ? 1000000 : 50;
};

const buildUsagePeriod = (plan) => {
  return plan === 'premium' ? 'monthly' : 'daily';
};

const generateApiKey = async (req, res, next) => {
  try {
    const { companyName, plan = 'free' } = req.body;

    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      throw new AppError('companyName is required', 400);
    }

    if (!['free', 'premium'].includes(plan)) {
      throw new AppError('plan must be either free or premium', 400);
    }

    const apiKey = crypto.randomBytes(32).toString('hex');

    const apiKeyDoc = await ApiKey.create({
      companyName: companyName.trim(),
      apiKey,
      plan,
      usageLimit: buildUsageLimit(plan),
      usedRequests: 0,
      usagePeriod: buildUsagePeriod(plan),
      usageResetAt: new Date()
    });

    return res.status(201).json({
      success: true,
      apiKey: apiKeyDoc.apiKey
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generateApiKey
};
