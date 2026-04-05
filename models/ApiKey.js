const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    usageLimit: {
      type: Number,
      default: 50,
      min: 0
    },
    usedRequests: {
      type: Number,
      default: 0,
      min: 0
    },
    usagePeriod: {
      type: String,
      enum: ['daily', 'monthly'],
      default: 'daily'
    },
    usageResetAt: {
      type: Date,
      default: () => new Date()
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

apiKeySchema.methods.needsUsageReset = function needsUsageReset() {
  if (!this.usageResetAt) return true;

  const now = new Date();
  const resetAt = new Date(this.usageResetAt);

  if (this.usagePeriod === 'monthly') {
    const nextMonth = new Date(resetAt);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return now >= nextMonth;
  }

  const nextDay = new Date(resetAt);
  nextDay.setDate(nextDay.getDate() + 1);
  return now >= nextDay;
};

apiKeySchema.methods.resetUsageIfNeeded = function resetUsageIfNeeded() {
  if (!this.needsUsageReset()) return false;

  this.usedRequests = 0;
  this.usageResetAt = new Date();
  return true;
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
