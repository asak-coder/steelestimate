'use strict';

const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    designation: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      enum: ['ISMB', 'ISMC', 'ISA'],
      index: true,
    },
    weightPerMeter: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

sectionSchema.index({ category: 1, designation: 1 }, { unique: true });
sectionSchema.index({ category: 1, weightPerMeter: 1 });

module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);
