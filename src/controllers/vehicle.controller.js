import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Owner } from "../models/datamodels/owner.model.js";
import { Vehicle } from "../models/datamodels/vehicle.model.js";
import { Category } from "../models/datamodels/category.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs";
// If you use Cart in deleteVehicle, import it:
import { Cart } from "../models/datamodels/cart.model.js"; // ensure this path is correct

const findCategoryFlexible = async ({ categoryID, categoryName }) => {
  if (categoryID && mongoose.Types.ObjectId.isValid(categoryID)) {
    const byId = await Category.findById(categoryID);
    if (byId) return byId;
  }
  if (categoryName && typeof categoryName === "string") {
    const name = categoryName.trim();
    if (!name) return null;
    // case-insensitive name match
    return await Category.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  }
  return null;
};

const registerVehicle = asyncHandler(async (req, res) => {
  const userDetails = req.user;

  const imageLocalPath = req.files?.image?.[0]?.path;
  if (!imageLocalPath) throw new ApiError(400, "no image local path found");

  const {
    name,
    description,
    price,
    stock,
    category,     // category name from client (optional)
    categoryID,   // category id from client (optional)
  } = req.body;

  if (!name || !description || price == null || stock == null) {
    // delete temp file on early exit
    if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath);
    throw new ApiError(400, "All fields are required");
  }

  // basic numeric validation
  const priceNum = Number(price);
  const stockNum = Number(stock);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath);
    throw new ApiError(400, "invalid price");
  }
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath);
    throw new ApiError(400, "invalid stock");
  }

  const existingVehicle = await Vehicle.findOne({ name: { $regex: `^${name.trim()}$`, $options: "i" } });
  if (existingVehicle) {
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
    throw new ApiError(400, "Vehicle already exists");
  }

  const categoryDoc = await findCategoryFlexible({
    categoryID,
    categoryName: category,
  });

  if (!categoryDoc) {
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
    throw new ApiError(400, "invalid category or category does not exist");
  }

  const ownerID = userDetails?.ownerID;
  if (!ownerID) {
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
    throw new ApiError(400, "Owner is not registered");
  }

  let image;
  try {
    image = await uploadToCloudinary(imageLocalPath);
  } catch (e) {
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
    throw new ApiError(500, "image failed to upload on cloudinary");
  } finally {
    // always remove local file
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
  }

  const vehicle = await Vehicle.create({
    ownerID,
    name: name.trim(),
    description: description.trim(),
    price: priceNum,
    stock: stockNum,
    categoryID: categoryDoc._id,
    image: image?.url,
  });

  if (!vehicle) throw new ApiError(500, "Failed to register the vehicle on the database");

  return res
    .status(200)
    .json(new ApiResponse(200, "Vehicle registered successfully", vehicle));
});

// unchanged endpoints, but keep populate
const vehicleDetails = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name && !description) throw new ApiError(400, "at least one field is required");

  const queryConditions = [];
  if (name && typeof name === "string") queryConditions.push({ name: { $regex: name, $options: "i" } });
  if (description && typeof description === "string") queryConditions.push({ description: { $regex: description, $options: "i" } });

  const vehicles = await Vehicle.find({ $or: queryConditions })
    .populate("categoryID", "name")
    .populate("ownerID", "storeName gstNumber address")
    .exec();

  return res.status(200).json(new ApiResponse(200, "vehicle fetched successfully", vehicles));
});

const allVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({})
    .populate("categoryID", "name")
    .populate("ownerID", "storeName gstNumber address")
    .exec();

  return res.status(200).json(new ApiResponse(200, "All the vehicles fetched successfully", vehicles));
});

const vehicleByID = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Vehicle ID is required.");

  const vehicle = await Vehicle.findById(id)
    .populate("categoryID", "name")
    .populate("ownerID", "storeName gstNumber address")
    .exec();

  if (!vehicle) throw new ApiError(404, "Vehicle not found.");
  return res.status(200).json(new ApiResponse(200, "Vehicle fetched successfully", vehicle));
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  if (!vehicleId) throw new ApiError(404, "vehicleId is required");

  const vehicle = await Vehicle.findByIdAndDelete(vehicleId);
  if (!vehicle) throw new ApiError(404, "vehicle not found or error in deleting from database");

  await Cart.updateMany({}, { $pull: { items: { vehicleID: vehicleId } } });
  return res.status(200).json(new ApiResponse(200, "Vehicle deleted and removed from all carts"));
});

export { registerVehicle, vehicleDetails, allVehicles, vehicleByID, deleteVehicle };
