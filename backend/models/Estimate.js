const mongoose = require('mongoose');

const estimateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectType: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  inputs: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  assumptions: {
    type: [String],
    default: []
  },
  results: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  warnings: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'shared', 'converted', 'archived'],
    default: 'calculated',
    index: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null,
    index: true
  },
  quotationText: {
    type: String,
    default: ''
  },
  pdf: {
    generated: {
      type: Boolean,
      default: false
    },
    url: {
      type: String,
      default: null
    },
    generatedAt: {
      type: Date,
      default: null
    }
  },
  engineVersion: {
    type: String,
    default: 'v1'
  },
  calculationMeta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

estimateSchema.index({ userId: 1, createdAt: -1 });
estimateSchema.index({ projectType: 1, createdAt: -1 });

module.exports = mongoose.models.Estimate || mongoose.model('Estimate', estimateSchema);