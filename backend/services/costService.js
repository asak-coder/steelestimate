const roundToTwo = (value) => Math.round(value * 100) / 100;

const estimateCost = async (boq) => {
    const rates = {
        primarySteelRate: 75,
        secondarySteelRate: 70,
        sheetingRate: 500
    };

    const totals = {
        primarySteel: roundToTwo(boq.primarySteelKg * rates.primarySteelRate),
        secondarySteel: roundToTwo(boq.secondarySteelKg * rates.secondarySteelRate),
        sheeting: roundToTwo(boq.roofSheetingSqm * rates.sheetingRate)
    };

    const grandTotal = roundToTwo(
        totals.primarySteel + totals.secondarySteel + totals.sheeting
    );

    const areaSqft = boq.roofSheetingSqm * 10.7639;
    const costPerSqft = areaSqft > 0 ? roundToTwo(grandTotal / areaSqft) : 0;

    return {
        rates,
        totals,
        grandTotal,
        costPerSqft
    };
};

module.exports = {
    estimateCost
};