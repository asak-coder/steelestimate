const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  weight: {
    type: Number,
    required: true
  },
  depth: {
    type: Number
  },
  flangeWidth: {
    type: Number
  },
  webThickness: {
    type: Number
  },
  flangeThickness: {
    type: Number
  },
  area: {
    type: Number
  },
  source: {
    type: String,
    default: 'IS database',
    trim: true
  }
}, {
  timestamps: true
});

sectionSchema.index({ type: 1, designation: 1, name: 1 });

module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);