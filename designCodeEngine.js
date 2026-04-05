const designCodes = {
  IS800: {
    steelGrade: 250,
    safetyFactor: 1.5,
  },
  AISC: {
    steelGrade: 345,
    safetyFactor: 1.67,
  },
  Eurocode: {
    steelGrade: 355,
    safetyFactor: 1.0,
  },
};

function getDesignCodeParameters(code) {
  if (!code) {
    throw new Error("Design code is required.");
  }

  const normalizedCode = String(code).trim().toUpperCase();

  if (normalizedCode === "EUROCODE") {
    return designCodes.Eurocode;
  }

  const selectedCode = designCodes[normalizedCode];

  if (!selectedCode) {
    throw new Error(`Unsupported design code: ${code}`);
  }

  return selectedCode;
}

module.exports = {
  designCodes,
  getDesignCodeParameters,
};
