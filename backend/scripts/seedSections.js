'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const { connectDB } = require(path.join(__dirname, '..', 'config', 'db'));
const Section = require(path.join(__dirname, '..', 'models', 'Section'));

const WORKBOOK_PATH = path.join(__dirname, '..', 'Steel_Sections_500plus_Dataset.xlsx');
const ALLOWED_CATEGORIES = ['ISMB', 'ISMC', 'ISA'];

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function toTrimmedString(value) {
  return String(value ?? '').trim();
}

function toPositiveNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = String(value).replace(/,/g, '').trim();
  const number = Number(normalized);

  return Number.isFinite(number) && number > 0 ? number : null;
}

function buildRowMap(row) {
  const map = new Map();

  Object.entries(row || {}).forEach(([key, value]) => {
    map.set(normalizeKey(key), value);
  });

  return map;
}

function pickRowValue(rowMap, candidates) {
  for (const candidate of candidates) {
    const value = rowMap.get(normalizeKey(candidate));
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return null;
}

function inferCategory(rawCategory, designation) {
  const combined = `${toTrimmedString(rawCategory)} ${toTrimmedString(designation)}`.toUpperCase();

  for (const category of ALLOWED_CATEGORIES) {
    if (combined.startsWith(category) || combined.includes(` ${category}`)) {
      return category;
    }
  }

  return null;
}

function parseWorkbookSections(workbookPath = WORKBOOK_PATH) {
  if (!fs.existsSync(workbookPath)) {
    throw new Error(
      `Steel sections workbook not found at ${workbookPath}. Place Steel_Sections_500plus_Dataset.xlsx in the backend folder or set a different path in the script.`
    );
  }

  const workbook = xlsx.readFile(workbookPath, {
    cellDates: false,
    raw: true,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The workbook does not contain any worksheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    defval: '',
    blankrows: false,
  });

  const sectionMap = new Map();
  let skippedRows = 0;
  let duplicateRows = 0;

  rows.forEach((row, index) => {
    const rowMap = buildRowMap(row);

    const designationValue = pickRowValue(rowMap, [
      'designation',
      'section',
      'sectiondesignation',
      'sectionname',
      'name',
      'size',
      'profile',
    ]);

    const rawCategoryValue = pickRowValue(rowMap, [
      'category',
      'type',
      'sectiontype',
      'material',
      'series',
    ]);

    const weightValue = pickRowValue(rowMap, [
      'weightpermeter',
      'weightpermeter',
      'weightpermetre',
      'weightkgm',
      'kgperm',
      'kgpermeter',
      'kgpermetre',
      'unitweight',
      'weight',
      'w',
    ]);

    const designation = toTrimmedString(designationValue);
    const category = inferCategory(rawCategoryValue, designation);
    const weightPerMeter = toPositiveNumber(weightValue);

    if (!designation || !category || weightPerMeter === null) {
      skippedRows += 1;
      return;
    }

    const doc = {
      designation,
      category,
      weightPerMeter,
    };

    const key = `${doc.category}::${doc.designation.toUpperCase()}`;
    if (sectionMap.has(key)) {
      duplicateRows += 1;
    }

    sectionMap.set(key, doc);
  });

  return {
    sections: Array.from(sectionMap.values()),
    skippedRows,
    duplicateRows,
    totalRows: rows.length,
  };
}

async function seedSectionsFromWorkbook(workbookPath = WORKBOOK_PATH) {
  await connectDB();

  try {
    const { sections, skippedRows, duplicateRows, totalRows } = parseWorkbookSections(workbookPath);

    if (!sections.length) {
      throw new Error('No valid section rows were found in the workbook.');
    }

    await Section.deleteMany({
      category: { $in: ALLOWED_CATEGORIES },
    });

    const inserted = await Section.insertMany(sections, { ordered: false });

    return {
      totalRows,
      inserted: inserted.length,
      skippedRows,
      duplicateRows,
    };
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  try {
    const stats = await seedSectionsFromWorkbook();
    console.log(
      `Seed completed: inserted=${stats.inserted}, skipped=${stats.skippedRows}, duplicates=${stats.duplicateRows}, totalRows=${stats.totalRows}`
    );
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  WORKBOOK_PATH,
  parseWorkbookSections,
  seedSectionsFromWorkbook,
};
