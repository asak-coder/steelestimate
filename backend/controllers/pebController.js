const soilEngine = require('../services/soilEngine')

function buildErrorResponse(res, error) {
  const statusCode = error.statusCode || 500
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error'
  })
}

async function estimatePEB(req, res) {
  try {
    const result = await Promise.resolve().then(() => {
      if (typeof soilEngine.estimatePEB === 'function') {
        return soilEngine.estimatePEB(req.body)
      }

      return {
        success: true,
        message: 'Estimate engine is not available'
      }
    })

    return res.json(result)
  } catch (error) {
    return buildErrorResponse(res, error)
  }
}

async function mapLocation(req, res) {
  try {
    const { latitude, longitude } = req.body || {}
    const result = soilEngine.mapLocationToConditions(latitude, longitude)

    return res.status(200).json({
      location: result.location,
      soilType: result.soilType,
      windSpeed: result.windSpeed,
      source: result.source
    })
  } catch (error) {
    return buildErrorResponse(res, error)
  }
}

module.exports = {
  estimatePEB,
  mapLocation
}