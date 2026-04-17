const express = require('express')
const pebController = require('../controllers/pebController')

const router = express.Router()

router.post('/estimate', pebController.estimatePEB)
router.post('/location', pebController.mapLocation)

module.exports = router