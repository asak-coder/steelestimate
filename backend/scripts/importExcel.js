const mongoose = require("mongoose");
const XLSX = require("xlsx");
const Section = require("../models/Section");

const MONGO_URI = process.env.MONGO_URI;

const importExcel = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const workbook = XLSX.readFile("./Steel_Sections_500plus_Dataset.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const formatted = rows.map((row) => ({
      designation: row.designation || row.Designation,
      category: row.category || row.Category,
      weightPerMeter: parseFloat(row.weightPerMeter || row.Weight),
    }));

    await Section.deleteMany(); // optional
    await Section.insertMany(formatted);

    console.log(`✅ Inserted ${formatted.length} records`);

    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

importExcel();