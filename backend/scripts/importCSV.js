require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const Section = require("../models/Section");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

const results = [];

const importCSV = async () => {
  try {
    // Connect DB
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // Read CSV
    fs.createReadStream("./steel_sections.csv")
      .pipe(csv())
      .on("data", (data) => {
        try {
          // Get category safely
          let rawCategory = data.category || data.Category;

          if (!rawCategory) return;

          rawCategory = rawCategory.toUpperCase();

          let category;

          if (rawCategory.includes("ISMB")) category = "ISMB";
          else if (rawCategory.includes("ISMC")) category = "ISMC";
          else if (rawCategory.includes("ISA")) category = "ISA";
          else return; // skip unknown rows

          // Parse weight safely
          const weight = parseFloat(
            data.weightPerMeter || data.Weight
          );

          if (!weight || isNaN(weight)) return;

          // Push clean record
          results.push({
            designation: data.designation || data.Designation,
            category,
            weightPerMeter: weight,
          });
        } catch (err) {
          console.warn("⚠️ Skipping invalid row:", data);
        }
      })
      .on("end", async () => {
        try {
          console.log(`📦 Total parsed records: ${results.length}`);

          // Clear old data
          await Section.deleteMany();

          // Insert new data
          await Section.insertMany(results);

          console.log(`✅ Successfully imported ${results.length} records`);

          process.exit();
        } catch (err) {
          console.error("❌ Insert error:", err);
          process.exit(1);
        }
      })
      .on("error", (err) => {
        console.error("❌ File read error:", err);
        process.exit(1);
      });

  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  }
};

importCSV();