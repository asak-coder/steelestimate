const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    usageDate: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    count: {
      type: Number,
      default: 1,
      min: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

usageLogSchema.index({ userId: 1, usageDate: 1, action: 1 }, { unique: true });

module.exports = mongoose.model('UsageLog', usageLogSchema);