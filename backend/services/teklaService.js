const roundToTwo = (value) => Math.round(value * 100) / 100;

const getBaySpacing = (length) => {
  const numericLength = Number(length || 0);

  if (numericLength >= 120) {
    return 8;
  }

  if (numericLength >= 80) {
    return 7.5;
  }

  if (numericLength >= 50) {
    return 6;
  }

  if (numericLength >= 30) {
    return 5;
  }

  return 4.5;
};

const getColumnSection = ({ height, crane, craneCapacity, areaSqm }) => {
  const numericHeight = Number(height || 0);
  const area = Number(areaSqm || 0);
  const capacity = Number(craneCapacity || 0);

  if (crane === true || capacity >= 20 || numericHeight > 12 || area >= 15000) {
    return 'ISMB 450';
  }

  if (capacity >= 10 || numericHeight > 9 || area >= 8000) {
    return 'ISMB 400';
  }

  if (numericHeight > 6 || area >= 3000) {
    return 'ISMB 350';
  }

  return 'ISMB 300';
};

const getRafterDepth = ({ span, height, crane }) => {
  const numericSpan = Number(span || 0);
  const numericHeight = Number(height || 0);

  let depth = numericSpan / 18;

  if (numericHeight > 10) {
    depth *= 1.08;
  }

  if (crane === true) {
    depth *= 1.12;
  }

  return Math.max(450, Math.round(depth));
};

const getConnectionType = ({ crane, craneCapacity, bayCount }) => {
  const capacity = Number(craneCapacity || 0);

  if (crane === true || capacity >= 10) {
    return bayCount > 12 ? 'end-plate with stiffeners' : 'bolted moment connection';
  }

  return bayCount > 10 ? 'simple shear with splice' : 'bolted shear connection';
};

const generateTeklaModel = async (input) => {
  const length = Number(input.length || 0);
  const width = Number(input.width || 0);
  const height = Number(input.height || 0);
  const frameSpacing = getBaySpacing(length);
  const bayCount = Math.max(1, Math.ceil(length / frameSpacing));
  const baySpacing = roundToTwo(length / bayCount);
  const columnSection = getColumnSection({ height, crane: input.crane, craneCapacity: input.craneCapacity, areaSqm: length * width });
  const rafterDepth = getRafterDepth({ span: width, height, crane: input.crane });
  const connectionType = getConnectionType({ crane: input.crane, craneCapacity: input.craneCapacity, bayCount });

  return {
    frameSpacing,
    baySpacing,
    bayCount,
    columnSection,
    rafterDepth,
    connectionType,
    columnHeight: height,
    rafterType: 'tapered'
  };
};

module.exports = {
  generateTeklaModel
};