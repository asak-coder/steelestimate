const roundToTwo = (value) => Math.round(value * 100) / 100;

const calculatePEB = async (input) => {
    const { length, width, height, crane, craneCapacity } = input;

    const areaSqm = roundToTwo(length * width);
    const areaSqft = roundToTwo(areaSqm * 10.7639);

    let steelRatePerSqm = 35;

    if (height <= 6) {
        steelRatePerSqm = 25;
    } else if (height <= 10) {
        steelRatePerSqm = 30;
    }

    let estimatedSteelWeightKg = areaSqm * steelRatePerSqm;

    if (crane === true) {
        estimatedSteelWeightKg *= 1.1;
    }

    if (typeof craneCapacity === 'number' && craneCapacity > 0) {
        estimatedSteelWeightKg += craneCapacity * 50;
    }

    return {
        areaSqm,
        areaSqft,
        steelRatePerSqm,
        estimatedSteelWeightKg: roundToTwo(estimatedSteelWeightKg)
    };
};

module.exports = {
    calculatePEB
};