const mongoose = require('mongoose');

const rateItemSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      required: true
    },
    label: {
      type: String,
      trim: true,
      required: true
    },
    unit: {
      type: String,
      trim: true,
      default: 'unit'
    },
    baseRate: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      trim: true,
      default: 'INR'
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
      index: true
    },
    projectType: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'all',
      index: true
    },
    locationTier: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'all',
      index: true
    },
    clientType: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'all',
      index: true
    },
    effectiveFrom: {
      type: Date,
      default: () => new Date(),
      index: true
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    aiRecommended: {
      type: Boolean,
      default: false
    },
    aiNotes: {
      type: String,
      trim: true,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    minimize: false
  }
);

rateItemSchema.index({ code: 1, projectType: 1, locationTier: 1, clientType: 1, effectiveFrom: -1 });
rateItemSchema.index({ category: 1, isActive: 1, effectiveFrom: -1 });

rateItemSchema.methods.isEffectiveOn = function isEffectiveOn(date = new Date()) {
  const target = new Date(date);
  const from = this.effectiveFrom ? new Date(this.effectiveFrom) : null;
  const to = this.effectiveTo ? new Date(this.effectiveTo) : null;

  if (from && target < from) return false;
  if (to && target > to) return false;
  return this.isActive !== false;
};

const rateMasterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      default: 'default-rate-book'
    },
    version: {
      type: String,
      trim: true,
      default: 'v1',
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    effectiveFrom: {
      type: Date,
      default: () => new Date(),
      index: true
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    items: {
      type: [rateItemSchema],
      default: []
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    minimize: false
  }
);

rateMasterSchema.index({ name: 1, version: 1 }, { unique: true });
rateMasterSchema.index({ isActive: 1, createdAt: -1 });

rateMasterSchema.methods.getActiveItems = function getActiveItems(date = new Date()) {
  return (this.items || []).filter((item) => item && typeof item.isEffectiveOn === 'function' ? item.isEffectiveOn(date) : true);
};

module.exports = mongoose.models.RateMaster || mongoose.model('RateMaster', rateMasterSchema);