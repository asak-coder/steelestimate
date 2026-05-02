const mongoose = require('mongoose');

const bruteForceCounterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    firstAttemptAt: {
      type: Date,
      default: Date.now
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now
    },
    lockUntil: {
      type: Date,
      default: null,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: false
  }
);

bruteForceCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_brute_force_counters_expires_at' });
bruteForceCounterSchema.index(
  { lockUntil: 1 },
  {
    name: 'idx_brute_force_lock_until',
    partialFilterExpression: {
      lockUntil: { $type: 'date' }
    }
  }
);

module.exports = mongoose.models.BruteForceCounter || mongoose.model('BruteForceCounter', bruteForceCounterSchema);
