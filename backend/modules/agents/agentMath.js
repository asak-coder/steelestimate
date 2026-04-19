const roundToTwo = (value) => {
  const numericValue = Number(value || 0);
  return Math.round(numericValue * 100) / 100;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const deriveProjectProfile = (input = {}) => {
  const projectType = String(input.projectType || input.type || 'general').trim().toLowerCase();
  const tonnage = Math.max(0, toNumber(input.tonnage ?? input.projectTonnage ?? input.weight, 0));
  const height = Math.max(0, toNumber(input.height ?? input.buildingHeight, 0));
  const isHazardous = Boolean(input.hazard ?? input.hazardous ?? input.hazardToggle);

  const tonnageFactor = clamp(1 + tonnage / 1000, 1, 3.5);
  const heightFactor = clamp(1 + height / 100, 1, 2.2);
  const hazardFactor = isHazardous ? 1.12 : 1;
  const complexityFactor = roundToTwo(tonnageFactor * heightFactor * hazardFactor);

  return {
    projectType,
    tonnage,
    height,
    hazard: isHazardous,
    complexityFactor
  };
};

module.exports = {
  roundToTwo,
  clamp,
  toNumber,
  deriveProjectProfile
};