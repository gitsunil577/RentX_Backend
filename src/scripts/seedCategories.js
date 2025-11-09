import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../models/datamodels/category.model.js";

dotenv.config();

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear existing categories to avoid duplicates
    await Category.deleteMany({});

    await Category.insertMany([
      { name: "Cars" },
      { name: "Bikes" },
      { name: "Scooters" },
      { name: "Bicycles" },
      { name: "SUVs" },
      { name: "Trucks" },
      { name: "Electric Vehicles" },
    ]);
    console.log("✅ Default categories inserted successfully");
    console.log("📋 Categories: Cars, Bikes, Scooters, Bicycles, SUVs, Trucks, Electric Vehicles");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding categories:", err);
    process.exit(1);
  }
};

seedCategories();
