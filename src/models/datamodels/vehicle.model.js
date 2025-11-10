import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    ownerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priceUSD: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
      // Price entered by owner in USD (for display)
    },
    priceINR: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
      // Converted price in INR (used for payments and calculations)
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
      // Keeping for backward compatibility, stores INR price
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
    },
    categoryID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Helpful indexes for faster queries
export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
