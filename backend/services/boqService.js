const roundToTwo = (value) => Math.round(value * 100) / 100;

const generateBOQ = async (calc) => {
    const primarySteelKg = roundToTwo(calc.estimatedSteelWeightKg);
    const secondarySteelKg = roundToTwo(primarySteelKg * 0.25);
    const roofSheetingSqm = roundToTwo(calc.areaSqm);

    return {
        primarySteelKg,
        secondarySteelKg,
        roofSheetingSqm
    };
};

module.exports = {
    generateBOQ
};