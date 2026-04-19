const express = require('express');
const Section = require('../models/Section');

const router = express.Router();

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res, next) => {
  try {
    const sections = await Section.find({})
      .sort({ designation: 1, name: 1 })
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
    const type = String(req.params.type || '').trim();

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Section type is required'
      });
    }

    const sections = await Section.find({
      type: new RegExp(`^${escapeRegex(type)}$`, 'i')
    })
      .sort({ designation: 1, name: 1 })
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
