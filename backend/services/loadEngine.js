function normalizeLoadInput(input) {
  if (!input || typeof input !== 'object') {
    return {}
  }

  return input
}

function calculateLoadEstimate(input) {
  const payload = normalizeLoadInput(input)

  return {
    success: true,
    payload,
    source: 'loadEngine'
  }
}

module.exports = {
  calculateLoadEstimate,
  normalizeLoadInput
}