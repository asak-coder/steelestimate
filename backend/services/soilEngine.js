const SOIL_TYPES = ['clay', 'silt', 'sand', 'loam', 'peat', 'chalk']

function normalizeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function validateCoordinates(latitude, longitude) {
  const lat = normalizeNumber(latitude)
  const lon = normalizeNumber(longitude)

  if (lat === null || lon === null) {
    const error = new Error('Latitude and longitude are required and must be valid numbers')
    error.statusCode = 400
    throw error
  }

  if (lat < -90 || lat > 90) {
    const error = new Error('Latitude must be between -90 and 90')
    error.statusCode = 400
    throw error
  }

  if (lon < -180 || lon > 180) {
    const error = new Error('Longitude must be between -180 and 180')
    error.statusCode = 400
    throw error
  }

  return { latitude: lat, longitude: lon }
}

function fallbackLocationMapping(latitude, longitude) {
  const latBucket = Math.abs(Math.floor(latitude * 1000))
  const lonBucket = Math.abs(Math.floor(longitude * 1000))

  const soilIndex = (latBucket + lonBucket) % SOIL_TYPES.length
  const windSpeed = Number((((latBucket % 350) + (lonBucket % 250)) / 10 + 2).toFixed(1))

  return {
    soilType: SOIL_TYPES[soilIndex],
    windSpeed,
    source: 'fallback'
  }
}

function mapLocationToConditions(latitude, longitude) {
  const location = validateCoordinates(latitude, longitude)
  return {
    location,
    ...fallbackLocationMapping(location.latitude, location.longitude)
  }
}

module.exports = {
  mapLocationToConditions,
  validateCoordinates,
  fallbackLocationMapping
}