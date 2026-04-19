'use strict';

const path = require('path');

const db = require(path.join(__dirname, '..', 'config', 'db'));
const Section = require(path.join(__dirname, '..', 'models', 'Section'));

const sections = [
  {
    type: 'ISMB',
    designation: 'ISMB 100',
    weight: 8.0,
    depth: 100,
    flangeWidth: 75,
    webThickness: 4.1,
    flangeThickness: 5.7,
    area: 10.2,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 125',
    weight: 11.9,
    depth: 125,
    flangeWidth: 75,
    webThickness: 4.4,
    flangeThickness: 6.8,
    area: 15.2,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 150',
    weight: 14.9,
    depth: 150,
    flangeWidth: 80,
    webThickness: 4.8,
    flangeThickness: 7.2,
    area: 19.0,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 175',
    weight: 19.3,
    depth: 175,
    flangeWidth: 90,
    webThickness: 5.0,
    flangeThickness: 8.0,
    area: 24.6,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 200',
    weight: 25.4,
    depth: 200,
    flangeWidth: 100,
    webThickness: 5.7,
    flangeThickness: 8.5,
    area: 32.4,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 225',
    weight: 31.2,
    depth: 225,
    flangeWidth: 110,
    webThickness: 5.8,
    flangeThickness: 9.2,
    area: 39.8,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 250',
    weight: 37.3,
    depth: 250,
    flangeWidth: 125,
    webThickness: 6.1,
    flangeThickness: 9.6,
    area: 47.5,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 300',
    weight: 44.2,
    depth: 300,
    flangeWidth: 140,
    webThickness: 6.7,
    flangeThickness: 10.2,
    area: 56.3,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 350',
    weight: 52.4,
    depth: 350,
    flangeWidth: 140,
    webThickness: 7.4,
    flangeThickness: 11.4,
    area: 66.8,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 400',
    weight: 61.5,
    depth: 400,
    flangeWidth: 140,
    webThickness: 8.0,
    flangeThickness: 12.4,
    area: 78.4,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 450',
    weight: 72.4,
    depth: 450,
    flangeWidth: 150,
    webThickness: 8.6,
    flangeThickness: 13.0,
    area: 92.2,
    source: 'IS database',
  },
  {
    type: 'ISMB',
    designation: 'ISMB 500',
    weight: 86.9,
    depth: 500,
    flangeWidth: 180,
    webThickness: 9.0,
    flangeThickness: 14.2,
    area: 110.7,
    source: 'IS database',
  },
  {
    type: 'ISMC',
    designation: 'ISMC 75',
    weight: 7.1,
    depth: 75,
    flangeWidth: 40,
    webThickness: 4.4,
    flangeThickness: 7.0,
    area: 9.1,
    source: 'IS database',
  },
  {
    type: 'ISMC',
    designation: 'ISMC 100',
    weight: 9.6,
    depth: 100,
    flangeWidth: 50,
    webThickness: 4.7,
    flangeThickness: 7.5,
    area: 12.2,
    source: 'IS database',
  },
  {
    type: 'ISMC',
    designation: 'ISMC 125',
    weight: 13.1,
    depth: 125,
    flangeWidth: 65,
    webThickness: 5.0,
    flangeThickness: 8.0,
    area: 16.7,
    source: 'IS database',
  },
  {
    type: 'ISMC',
    designation: 'ISMC 150',
    weight: 16.8,
    depth: 150,
    flangeWidth: 75,
    webThickness: 5.4,
    flangeThickness: 8.6,
    area: 21.4,
    source: 'IS database',
  },
  {
    type: 'ISMC',
    designation: 'ISMC 175',
    weight: 20.6,
    depth: 175,
    flangeWidth: 75,
    webThickness: 5.5,
    flangeThickness: 9.2,
    area: 26.2,
    source: 'IS database',
  },
  {
    type: 'ISMC',
    designation: 'ISMC 200',
    weight: 25.4,
    depth: 200,
    flangeWidth: 75,
    webThickness: 6.0,
    flangeThickness: 10.2,
    area: 32.4,
    source: 'IS database',
  },
  {
    type: 'ISMC',
    designation: 'ISMC 250',
    weight: 37.3,
    depth: 250,
    flangeWidth: 82,
    webThickness: 6.9,
    flangeThickness: 11.0,
    area: 47.5,
    source: 'IS database',
  },
  {
    type: 'ISMC',
    designation: 'ISMC 300',
    weight: 46.2,
    depth: 300,
    flangeWidth: 90,
    webThickness: 7.5,
    flangeThickness: 12.0,
    area: 58.9,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 40x40x4',
    weight: 2.4,
    depth: 40,
    flangeWidth: 40,
    webThickness: 4,
    flangeThickness: 4,
    area: 3.1,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 50x50x5',
    weight: 3.8,
    depth: 50,
    flangeWidth: 50,
    webThickness: 5,
    flangeThickness: 5,
    area: 4.8,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 65x65x6',
    weight: 5.7,
    depth: 65,
    flangeWidth: 65,
    webThickness: 6,
    flangeThickness: 6,
    area: 7.3,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 75x75x6',
    weight: 6.8,
    depth: 75,
    flangeWidth: 75,
    webThickness: 6,
    flangeThickness: 6,
    area: 8.7,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 75x75x8',
    weight: 8.9,
    depth: 75,
    flangeWidth: 75,
    webThickness: 8,
    flangeThickness: 8,
    area: 11.4,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 90x90x6',
    weight: 8.2,
    depth: 90,
    flangeWidth: 90,
    webThickness: 6,
    flangeThickness: 6,
    area: 10.5,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 90x90x8',
    weight: 10.8,
    depth: 90,
    flangeWidth: 90,
    webThickness: 8,
    flangeThickness: 8,
    area: 13.8,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 100x100x8',
    weight: 12.1,
    depth: 100,
    flangeWidth: 100,
    webThickness: 8,
    flangeThickness: 8,
    area: 15.4,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 100x100x10',
    weight: 15.0,
    depth: 100,
    flangeWidth: 100,
    webThickness: 10,
    flangeThickness: 10,
    area: 19.1,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 110x110x10',
    weight: 16.8,
    depth: 110,
    flangeWidth: 110,
    webThickness: 10,
    flangeThickness: 10,
    area: 21.4,
    source: 'IS database',
  },
  {
    type: 'ISA',
    designation: 'ISA 130x130x10',
    weight: 20.0,
    depth: 130,
    flangeWidth: 130,
    webThickness: 10,
    flangeThickness: 10,
    area: 25.5,
    source: 'IS database',
  },
];

function buildKey(section) {
  return `${section.type}::${section.designation}`;
}

async function connectDatabase() {
  if (typeof db === 'function') {
    return db();
  }

  if (db && typeof db.connectDB === 'function') {
    return db.connectDB();
  }

  if (db && typeof db.connect === 'function') {
    return db.connect();
  }

  return null;
}

async function disconnectDatabase() {
  if (db && typeof db.disconnect === 'function') {
    return db.disconnect();
  }

  const mongoose = require('mongoose');
  return mongoose.disconnect();
}

async function upsertSections() {
  const stats = {
    inserted: 0,
    updated: 0,
    skipped: 0,
  };

  for (const section of sections) {
    const normalizedSection = {
      ...section,
      name: section.name || section.designation,
      category: section.category || section.type,
    };

    const filter = {
      designation: normalizedSection.designation,
      $or: [
        { type: normalizedSection.type },
        { category: normalizedSection.category },
      ],
    };

    const existing = await Section.findOne(filter).lean();

    if (!existing) {
      await Section.create(normalizedSection);
      stats.inserted += 1;
      continue;
    }

    const nextData = {};
    let changed = false;

    for (const [key, value] of Object.entries(normalizedSection)) {
      if (key === '_id' || key === '__v') {
        continue;
      }

      if (existing[key] !== value) {
        nextData[key] = value;
        changed = true;
      }
    }

    if (changed) {
      await Section.updateOne(filter, { $set: nextData });
      stats.updated += 1;
    } else {
      stats.skipped += 1;
    }
  }

  return stats;
}

async function main() {
  try {
    await connectDatabase();
    const stats = await upsertSections();
    console.log(`Seed completed: inserted=${stats.inserted}, updated=${stats.updated}, skipped=${stats.skipped}`);
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    try {
      await disconnectDatabase();
    } catch (disconnectError) {
      console.error('Disconnect failed:', disconnectError);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  sections,
  upsertSections,
};
