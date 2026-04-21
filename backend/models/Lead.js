const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // =============================
  // BASIC LEAD (MOBILE)
  // =============================
  name: {
    type: String,
    trim: true,
  },

  phone: {
    type: String,
    required: true,
    trim: true,
  },

  message: {
    type: String,
    trim: true,
  },

  // =============================
  // OPTIONAL CLIENT DETAILS
  // =============================
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },

  clientName: {
    type: String,
    trim: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // =============================
  // LEAD ENRICHMENT
  // =============================
  estimatedCost: {
    type: Number,
    default: 0,
    min: 0,
  },

  area: {
    type: Number,
    default: 0,
    min: 0,
  },

  steel: {
    type: Number,
    default: 0,
    min: 0,
  },

  projectType: {
    type: String,
    trim: true,
    default: '',
  },

  source: {
    type: String,
    enum: ['calculator', 'ai', 'ai_estimator', 'boq', 'mobile', 'admin', 'api'],
    default: 'calculator',
  },

  priority: {
    type: String,
    enum: ['normal', 'high'],
    default: 'normal',
  },

  whatsappLink: {
    type: String,
    default: '',
  },

  whatsappMessage: {
    type: String,
    default: '',
  },

  adminNotifiedAt: {
    type: Date,
    default: null,
  },

  emailSentAt: {
    type: Date,
    default: null,
  },

  // =============================
  // ENGINEERING DATA (ADMIN)
  // =============================
  projectData: {
    type: Object,
    default: null,
  },

  boq: {
    type: Object,
    default: null,
  },

  cost: {
    type: Object,
    default: null,
  },

  quotationText: {
    type: String,
    default: '',
  },

  // =============================
  // AI / BUSINESS LOGIC
  // =============================
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

  tag: {
    type: String,
    enum: ['HOT', 'WARM', 'COLD'],
    default: 'COLD',
  },

  optimizedPrice: {
    type: Number,
    default: 0,
    min: 0,
  },

  marginSuggestion: {
    type: Object,
    default: null,
  },

  pricingJustification: {
    type: String,
    default: '',
  },

  // =============================
  // STATUS
  // =============================
  status: {
    type: String,
    enum: ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'],
    default: 'NEW',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Normalize status
leadSchema.pre('save', function (next) {
  if (typeof this.status === 'string') {
    this.status = this.status.toUpperCase();
  }
  if (!this.status) {
    this.status = 'NEW';
  }
  next();
});

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
