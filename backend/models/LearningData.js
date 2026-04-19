const mongoose = require('mongoose');

const learningDataSchema = new mongoose.Schema(
  {
    estimateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estimate',
      required: true,
      index: true
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}
    },
    aiSuggestions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    actualOutcome: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    minimize: false
  }
);

learningDataSchema.index({ createdAt: -1 });
learningDataSchema.index({ estimateId: 1, createdAt: -1 });

module.exports = mongoose.models.LearningData || mongoose.model('LearningData', learningDataSchema);