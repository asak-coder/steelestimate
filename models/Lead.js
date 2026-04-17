const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  projectData: {
    type: Object,
    required: true,
  },
  boq: {
    type: Object,
    required: true,
  },
  cost: {
    type: Object,
    required: true,
  },
  quotationText: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tag: {
    type: String,
    enum: ['HOT', 'WARM', 'COLD'],
    default: 'COLD'
  },
  optimizedPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  marginSuggestion: {
    type: Object,
    default: null
  },
  pricingJustification: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'],
    default: 'NEW',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

leadSchema.pre('save', function normalizeStatus(next) {
  if (typeof this.status === 'string') {
    this.status = this.status.toUpperCase();
  }
  if (!this.status) {
    this.status = 'NEW';
  }
  next();
});

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
