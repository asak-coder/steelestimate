export type StandardSection = {
  size: string;
  weightPerMeter: number;
};

export const ismbSections: StandardSection[] = [
  { size: '100', weightPerMeter: 11.9 },
  { size: '150', weightPerMeter: 14.9 },
  { size: '200', weightPerMeter: 25.4 },
];

export const ismcSections: StandardSection[] = [
  { size: '75', weightPerMeter: 7.14 },
  { size: '100', weightPerMeter: 9.56 },
  { size: '125', weightPerMeter: 13.1 },
];

export const isaSections: StandardSection[] = [
  { size: '25x25x3', weightPerMeter: 1.12 },
  { size: '40x40x5', weightPerMeter: 2.98 },
  { size: '65x65x6', weightPerMeter: 5.72 },
];

export const isStandardDatabases = {
  ISMB: ismbSections,
  ISMC: ismcSections,
  ISA: isaSections,
} as const;