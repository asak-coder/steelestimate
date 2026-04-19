const express = require('express');
const Section = require('../models/Section');

const router = express.Router();

const ALLOWED_TYPES = new Set(['ISMB', 'ISMC', 'ISA']);

router.get('/', async (req, res, next) => {
  try {
    const sections = await Section.find({})
      .sort({ category: 1, designation: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:type', async (req, res, next) => {
  try {
    const type = String(req.params.type || '').trim().toUpperCase();

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Section type is required'
      });
    }

    if (!ALLOWED_TYPES.has(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section type'
      });
    }

    const sections = await Section.find({ category: type })
      .sort({ designation: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
