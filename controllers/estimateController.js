const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const Estimate = require('../models/Estimate');
const Lead = require('../models/Lead');
const { createEstimateRecord, fetchEstimateById, generateEstimatePdfBuffer } = require('../services/estimateService');

const isValidObjectId = (value) => typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);

const sanitizeEstimate = (estimate) => ({
  id: estimate._id,
  projectType: estimate.projectType,
  inputs: estimate.inputs || {},
  assumptions: Array.isArray(estimate.assumptions) ? estimate.assumptions : [],
  results: estimate.results || {},
  warnings: Array.isArray(estimate.warnings) ? estimate.warnings : [],
  meta: {
    id: estimate._id,
    userId: estimate.userId || null,
    status: estimate.status || 'calculated',
    engineVersion: estimate.engineVersion || 'v1',
    createdAt: estimate.createdAt,
    updatedAt: estimate.updatedAt
  }
});

const createEstimate = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body.userId;
    console.log('[estimate] incoming request', {
      userId: userId || null,
      projectType: req.body.projectType,
      hasInputs: Boolean(req.body.inputs)
    });

    const estimate = await createEstimateRecord({
      userId,
      projectType: req.body.projectType,
      inputs: req.body.inputs,
      source: req.body.source || 'api'
    });

    console.log('[estimate] calculated result', {
      estimateId: estimate._id,
      projectType: estimate.projectType
    });

    return res.status(201).json({
      success: true,
      data: sanitizeEstimate(estimate)
    });
  } catch (error) {
    console.error('[estimate] create failed:', error.message);
    return next(error);
  }
};

const getEstimateById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new AppError('Invalid estimate id', 400);
    }

    const estimate = await fetchEstimateById(id);
    console.log('[estimate] fetched by id', { estimateId: id, found: Boolean(estimate) });

    if (!estimate) {
      throw new AppError('Estimate not found', 404);
    }

    if (req.user?.role !== 'admin' && req.user?.id && estimate.userId?.toString() !== req.user.id) {
      throw new AppError('Not authorized to access this estimate', 403);
    }

    return res.status(200).json({
      success: true,
      data: sanitizeEstimate(estimate)
    });
  } catch (error) {
    return next(error);
  }
};

const generateEstimatePdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new AppError('Invalid estimate id', 400);
    }

    const estimate = await Estimate.findById(id).populate('userId', 'name email role');

    if (!estimate) {
      throw new AppError('Estimate not found', 404);
    }

    if (req.user?.role !== 'admin' && req.user?.id && estimate.userId?._id?.toString() !== req.user.id) {
      throw new AppError('Not authorized to access this estimate', 403);
    }

    const pdfBuffer = await generateEstimatePdfBuffer(estimate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="estimate-${estimate._id}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
};

const convertEstimateToLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new AppError('Invalid estimate id', 400);
    }

    const estimate = await Estimate.findById(id);

    if (!estimate) {
      throw new AppError('Estimate not found', 404);
    }

    const lead = await Lead.create({
      userId: req.user.id,
      clientName: req.body.clientName,
      phone: req.body.phone,
      email: req.body.email,
      projectData: {
        estimateId: estimate._id,
        projectType: estimate.projectType,
        inputs: estimate.inputs,
        assumptions: estimate.assumptions,
        results: estimate.results,
        warnings: estimate.warnings
      },
      boq: estimate.results?.boq || {},
      cost: estimate.results?.cost || {},
      quotationText: estimate.results?.quotationText || '',
      status: 'new'
    });

    estimate.leadId = lead._id;
    estimate.status = 'converted';
    await estimate.save();

    return res.status(201).json({
      success: true,
      data: {
        estimate: sanitizeEstimate(estimate),
        leadId: lead._id
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createEstimate,
  getEstimateById,
  generateEstimatePdf,
  convertEstimateToLead
};
