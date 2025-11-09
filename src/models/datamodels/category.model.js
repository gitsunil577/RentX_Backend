import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      enum: [
        "Cars",
        "Bikes",
        "Scooters",
        "Bicycles",
        "SUVs",
        "Trucks",
        "Electric Vehicles",
      ],
    },
  },
  { timestamps: true }
);

// Ensure unique index for category names


export const Category = mongoose.model("Category", categorySchema);
