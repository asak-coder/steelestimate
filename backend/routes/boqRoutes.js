const express = require('express');
const boqController = require('../controllers/boqController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { attachPlanFlags, requireBoqExportAccess } = require('../middleware/featureGate');

const router = express.Router();

function pickHandler(controller, candidates) {
  for (const name of candidates) {
    if (controller && typeof controller[name] === 'function') {
      return controller[name];
    }
  }
  return (req, res) =>
    res.status(501).json({
      success: false,
      message: 'This BOQ endpoint is not configured.'
    });
}

const saveBoqProject = pickHandler(boqController, [
  'saveBoqProject',
  'createBoqProject',
  'saveProjectBoq',
  'createProjectBoq'
]);
const getBoqProjects = pickHandler(boqController, [
  'getBoqProjects',
  'listBoqProjects',
  'getProjects',
  'getAllBoqProjects'
]);
const getBoqProjectById = pickHandler(boqController, [
  'getBoqProjectById',
  'getBoqProject',
  'getProjectById',
  'fetchBoqProjectById'
]);
const exportBoqProject = pickHandler(boqController, [
  'exportBoqProject',
  'downloadBoqProject',
  'generateBoqExport',
  'exportBoq',
  'downloadBoq'
]);

router.use(verifyToken, attachPlanFlags);

router.get('/', getBoqProjects);
router.get('/projects', getBoqProjects);
router.get('/projects/:id', getBoqProjectById);
router.get('/:id', getBoqProjectById);
router.post('/', saveBoqProject);
router.post('/projects', saveBoqProject);
router.post('/save', saveBoqProject);
router.post('/create', saveBoqProject);
router.post('/export', requireAdmin, requireBoqExportAccess, exportBoqProject);
router.post('/projects/:id/export', requireAdmin, requireBoqExportAccess, exportBoqProject);
router.post('/:id/export', requireAdmin, requireBoqExportAccess, exportBoqProject);
router.get('/projects/:id/export', requireAdmin, requireBoqExportAccess, exportBoqProject);
router.get('/:id/export', requireAdmin, requireBoqExportAccess, exportBoqProject);
router.post('/:id/download', requireAdmin, requireBoqExportAccess, exportBoqProject);

module.exports = router;
