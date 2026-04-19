const express = require('express');
const boqController = require('../controllers/boqController');
const authModule = require('../middleware/auth');
const { attachPlanFlags, requireBoqExportAccess } = require('../middleware/featureGate');

const router = express.Router();

const protectCandidate =
  (authModule &&
    (authModule.protect ||
      authModule.protectRoute ||
      authModule.requireAuth ||
      authModule.authMiddleware ||
      authModule.authenticate ||
      authModule.auth ||
      authModule.ensureAuthenticated ||
      authModule.default)) ||
  authModule;
const protect = typeof protectCandidate === 'function' ? protectCandidate : (req, res, next) => next();

function pickHandler(controller, candidates) {
  for (const name of candidates) {
    if (controller && typeof controller[name] === 'function') {
      return controller[name];
    }
  }
  return (req, res) =>
    res.status(501).json({
      success: false,
      message: 'This BOQ endpoint is not configured.',
    });
}

const saveBoqProject = pickHandler(boqController, [
  'saveBoqProject',
  'createBoqProject',
  'saveProjectBoq',
  'createProjectBoq',
]);
const getBoqProjects = pickHandler(boqController, [
  'getBoqProjects',
  'listBoqProjects',
  'getProjects',
  'getAllBoqProjects',
]);
const getBoqProjectById = pickHandler(boqController, [
  'getBoqProjectById',
  'getBoqProject',
  'getProjectById',
  'fetchBoqProjectById',
]);
const exportBoqProject = pickHandler(boqController, [
  'exportBoqProject',
  'downloadBoqProject',
  'generateBoqExport',
  'exportBoq',
  'downloadBoq',
]);

router.use(protect, attachPlanFlags);

router.get('/', getBoqProjects);
router.get('/projects', getBoqProjects);
router.post('/', saveBoqProject);
router.post('/projects', saveBoqProject);
router.post('/save', saveBoqProject);
router.post('/create', saveBoqProject);
router.post('/export', requireBoqExportAccess, exportBoqProject);
router.get('/:id', getBoqProjectById);
router.get('/projects/:id', getBoqProjectById);
router.post('/:id/export', requireBoqExportAccess, exportBoqProject);
router.post('/projects/:id/export', requireBoqExportAccess, exportBoqProject);
router.get('/:id/export', requireBoqExportAccess, exportBoqProject);
router.get('/projects/:id/export', requireBoqExportAccess, exportBoqProject);
router.post('/:id/download', requireBoqExportAccess, exportBoqProject);

module.exports = router;
