const mongoose = require('mongoose');

const { Schema } = mongoose;

const boqItemSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['IS', 'PLATE', 'PIPE'],
      trim: true
    },
    section: {
      type: String,
      required: true,
      trim: true
    },
    dimensions: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },
    weight: {
      type: Number,
      required: true,
      default: 0
    },
    cost: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: {
      type: [boqItemSchema],
      default: []
    },
    totalWeight: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    projectName: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ userId: 1, createdAt: -1 });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

module.exports = Project;