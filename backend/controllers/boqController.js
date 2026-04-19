const mongoose = require('mongoose');
const Project = require('../models/Project');
const AppError = require('../utils/appError');
const {
  generatePDF,
  generateExcel,
  buildExportFilename,
} = require('../services/exportService');

const isAdminUser = (user) =>
  user && (String(user.role || '').toUpperCase() === 'ADMIN' || user.isAdmin === true);

const serializeProject = (project) => {
  if (!project) {
    return project;
  }

  const plainProject = typeof project.toObject === 'function' ? project.toObject() : project;

  return {
    id: String(plainProject._id || plainProject.id),
    userId: String(plainProject.userId),
    items: Array.isArray(plainProject.items)
      ? plainProject.items.map((item) => ({
          type: item.type,
          section: item.section,
          dimensions: item.dimensions || {},
          weight: item.weight,
          cost: item.cost
        }))
      : [],
    totalWeight: plainProject.totalWeight ?? 0,
    totalCost: plainProject.totalCost ?? 0,
    projectName: plainProject.projectName || undefined,
    createdAt: plainProject.createdAt ? new Date(plainProject.createdAt).toISOString() : undefined,
    updatedAt: plainProject.updatedAt ? new Date(plainProject.updatedAt).toISOString() : undefined
  };
};

const ensureAuthenticatedUser = (req) => {
  const user = req.user;
  if (!user || (!user.id && !user._id)) {
    throw new AppError('Unauthorized', 401);
  }
  return user;
};

const canAccessProject = (user, project) => {
  if (isAdminUser(user)) {
    return true;
  }

  const userId = String(user.id || user._id);
  const projectUserId = String(project.userId);
  return projectUserId === userId;
};

const loadProjectByIdForUser = async (user, projectId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError('Invalid project id', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (!canAccessProject(user, project)) {
    throw new AppError('Forbidden', 403);
  }

  return project;
};

const saveBoqProject = async (req, res, next) => {
  try {
    const user = ensureAuthenticatedUser(req);
    const project = await Project.create({
      userId: user.id || user._id,
      items: req.body.items,
      totalWeight: req.body.totalWeight,
      totalCost: req.body.totalCost,
      projectName: req.body.projectName
    });

    res.status(201).json({
      success: true,
      data: serializeProject(project)
    });
  } catch (error) {
    next(error);
  }
};

const getBoqProjects = async (req, res, next) => {
  try {
    const user = ensureAuthenticatedUser(req);
    const filter = isAdminUser(user) ? {} : { userId: user.id || user._id };

    const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: projects.map(serializeProject)
    });
  } catch (error) {
    next(error);
  }
};

const getBoqProjectById = async (req, res, next) => {
  try {
    const user = ensureAuthenticatedUser(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid project id', 400);
    }

    const project = await Project.findById(id).lean();

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const userId = String(user.id || user._id);
    const projectUserId = String(project.userId);

    if (!isAdminUser(user) && projectUserId !== userId) {
      throw new AppError('Forbidden', 403);
    }

    res.json({
      success: true,
      data: serializeProject(project)
    });
  } catch (error) {
    next(error);
  }
};

const exportBoqProject = async (req, res, next) => {
  try {
    const user = ensureAuthenticatedUser(req);
    const projectId = req.body?.projectId || req.params?.id;
    const format = String(req.body?.format || req.query?.format || 'pdf').toLowerCase();

    if (!projectId) {
      throw new AppError('projectId is required', 400);
    }

    if (format !== 'pdf' && format !== 'excel' && format !== 'xlsx') {
      throw new AppError('Invalid export format', 400);
    }

    const project = await loadProjectByIdForUser(user, projectId);
    const exportFormat = format === 'xlsx' ? 'excel' : format;

    const buffer =
      exportFormat === 'excel'
        ? await generateExcel(project)
        : await generatePDF(project);

    const filename = buildExportFilename(project, exportFormat);
    const contentType =
      exportFormat === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveBoqProject,
  getBoqProjects,
  getBoqProjectById,
  exportBoqProject
};
