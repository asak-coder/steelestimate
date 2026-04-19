const mongoose = require('mongoose');

const estimateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}
    },
    engineering: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    cost: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    loss: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    commercial: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    clientStrategy: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    finalAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    minimize: false
  }
);

estimateSchema.index({ createdAt: -1 });
estimateSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Estimate || mongoose.model('Estimate', estimateSchema);