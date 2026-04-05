const LOCATION_WEIGHTS = {
  metro: 18,
  industrial: 14,
  urban: 12,
  semiurban: 8,
  rural: 4
};

const roundToTwo = (value) => Math.round(value * 100) / 100;

const getNormalizedLocationKey = (location) => {
  const text = String(location || '').toLowerCase();

  if (/(metro|mumbai|delhi|bengaluru|bangalore|chennai|hyderabad|pune|kolkata|ahmedabad|surat|noida|gurgaon|gurugram)/i.test(text)) {
    return 'metro';
  }

  if (/(industrial|plant|factory|warehouse|godown|sipcot|midc|estate|park|zone)/i.test(text)) {
    return 'industrial';
  }

  if (/(city|urban|town|municipal|corporation)/i.test(text)) {
    return 'urban';
  }

  if (/(village|rural|taluk|taluka|district|suburban|semiurban)/i.test(text)) {
    return 'semiurban';
  }

  return 'rural';
};

const calculateLeadScore = (input = {}) => {
  const length = Number(input.length || 0);
  const width = Number(input.width || 0);
  const area = roundToTwo(length * width);
  const crane = input.crane === true;
  const craneCapacity = Number(input.craneCapacity || 0);
  const locationKey = getNormalizedLocationKey(input.location);

  let sizeScore = 0;
  if (area >= 20000) {
    sizeScore = 50;
  } else if (area >= 10000) {
    sizeScore = 42;
  } else if (area >= 5000) {
    sizeScore = 32;
  } else if (area >= 2500) {
    sizeScore = 24;
  } else if (area >= 1000) {
    sizeScore = 16;
  } else if (area >= 500) {
    sizeScore = 10;
  } else {
    sizeScore = 6;
  }

  let craneScore = 0;
  if (crane) {
    craneScore = 20;
    if (craneCapacity >= 20) {
      craneScore = 25;
    } else if (craneCapacity >= 10) {
      craneScore = 22;
    }
  }

  const locationScore = LOCATION_WEIGHTS[locationKey] || 4;
  const rawScore = sizeScore + craneScore + locationScore;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let tag = 'COLD';
  if (score >= 70) {
    tag = 'HOT';
  } else if (score >= 45) {
    tag = 'WARM';
  }

  return {
    score,
    tag,
    breakdown: {
      area,
      sizeScore,
      craneScore,
      locationScore,
      locationKey
    }
  };
};

module.exports = {
  calculateLeadScore,
  getNormalizedLocationKey
};