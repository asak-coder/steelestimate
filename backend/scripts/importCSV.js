const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const Section = require("../models/Section");

const MONGO_URI = process.env.MONGO_URI;

const results = [];

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    fs.createReadStream("./steel_sections.csv")
      .pipe(csv())
      .on("data", (data) => {
        results.push({
          designation: data.designation || data.Designation,
          category: data.category || data.Category,
          weightPerMeter: parseFloat(
            data.weightPerMeter || data.Weight
          ),
        });
      })
      .on("end", async () => {
        try {
          await Section.deleteMany();
          await Section.insertMany(results);

          console.log(`✅ Imported ${results.length} records`);
          process.exit();
        } catch (err) {
          console.error(err);
          process.exit(1);
        }
      });
  })
  .catch((err) => console.error(err));