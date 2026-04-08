const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

function calculateSteelTonnage({ length, width, height, span, windSpeed }) {
  const safeLength = Math.max(Number(length) || 0, 0);
  const safeWidth = Math.max(Number(width) || 0, 0);
  const safeHeight = Math.max(Number(height) || 0, 0);
  const safeSpan = Math.max(Number(span) || safeWidth, 0);
  const safeWindSpeed = Math.max(Number(windSpeed) || 0, 0);

  const area = safeLength * safeWidth;

  let factor = 30;
  if (safeSpan > 20) factor += 10;
  if (safeSpan > 30) factor += 10;
  if (safeHeight > 6) factor += 5;
  if (safeHeight > 10) factor += 5;
  if (safeWindSpeed > 39) factor += 5;

  const steelWeight = roundToTwo(area * factor);
  const steelTonnage = roundToTwo(steelWeight / 1000);

  return {
    area,
    factor,
    steelWeight,
    steelTonnage
  };
}

module.exports = {
  calculateSteelTonnage
};
