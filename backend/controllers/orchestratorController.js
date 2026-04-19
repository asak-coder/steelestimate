const AppError = require('../utils/appError');
const { orchestrateEstimate } = require('../modules/orchestrator/orchestrator.service');
const { storeOrchestratorOutput, generateEstimatePdfBuffer, fetchEstimateById } = require('../services/estimateService');

const buildInputPayload = (body = {}) => ({
  projectType: body.projectType,
  clientType: body.clientType || '',
  tonnage: body.tonnage,
  height: body.height,
  hazard: Boolean(body.hazard),
  location: body.location,
  length: body.length,
  width: body.width,
  crane: Boolean(body.crane),
  craneCapacity: body.craneCapacity,
  historicalRecords: body.historicalRecords,
  records: body.records,
  workType: body.workType,
  locationType: body.locationType,
  areaSqm: body.areaSqm,
  area: body.area,
  userNotes: body.userNotes || ''
});

const run = async (req, res, next) => {
  try {
    const payload = buildInputPayload(req.body || {});
    if (!payload.projectType) {
      throw new AppError('projectType is required', 400);
    }

    const result = await orchestrateEstimate({
      input: payload,
      userId: req.user?.id || null
    });

    const estimate = await storeOrchestratorOutput({
      userId: req.user?.id,
      projectType: payload.projectType,
      inputs: payload,
      orchestratorPayload: result,
      source: 'orchestrator'
    });

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        estimateId: estimate?._id || null
      }
    });
  } catch (error) {
    return next(error);
  }
};

const generatePdf = async (req, res, next) => {
  try {
    const estimate = await fetchEstimateById(req.params.id);
    if (!estimate) {
      throw new AppError('Estimate not found', 404);
    }

    const buffer = await generateEstimatePdfBuffer(estimate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="estimate-${estimate._id}.pdf"`);
    return res.status(200).send(buffer);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  run,
  generatePdf
};