const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

function calculateWindLoad(windSpeed) {
  const safeWindSpeed = Math.max(Number(windSpeed) || 0, 0);
  return roundToTwo(0.6 * safeWindSpeed * safeWindSpeed);
}

function calculateDeadLoad(steelWeight) {
  const safeSteelWeight = Math.max(Number(steelWeight) || 0, 0);
  return roundToTwo(safeSteelWeight * 0.00981);
}

function calculateTotalLoad({ steelWeight, windSpeed }) {
  const deadLoad = calculateDeadLoad(steelWeight);
  const windLoad = calculateWindLoad(windSpeed);
  const totalLoad = roundToTwo(deadLoad + windLoad);

  return {
    deadLoad,
    windLoad,
    totalLoad
  };
}

module.exports = {
  calculateWindLoad,
  calculateDeadLoad,
  calculateTotalLoad
};
