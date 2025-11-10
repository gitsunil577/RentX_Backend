/**
 * Vehicle Controller
 *
 * Currency Handling:
 * - Owners enter vehicle prices in USD (as displayed in the frontend)
 * - Backend automatically converts USD to INR using the conversion utility
 * - Both priceUSD and priceINR are stored in the database
 * - All bookings and payments are calculated using priceINR
 * - Current exchange rate: 1 USD = 83 INR (configurable in currencyConverter.js)
 */

import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Owner } from "../models/datamodels/owner.model.js";
import { Vehicle } from "../models/datamodels/vehicle.model.js";
import { Category } from "../models/datamodels/category.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { convertUSDtoINR, getExchangeRate } from "../utils/currencyConverter.js";
import fs from "fs";
// If you use Cart in deleteVehicle, import it:
import { Cart } from "../models/datamodels/cart.model.js"; // ensure this path is correct

const findCategoryFlexible = async ({ categoryID, categoryName }) => {
  // Try to find by ID first if provided
  if (categoryID) {
    if (mongoose.Types.ObjectId.isValid(categoryID)) {
      const byId = await Category.findById(categoryID);
      if (byId) {
        console.log("✅ Found category by ID:", byId.name);
        return byId;
      }
    } else {
      console.log("⚠️ Invalid ObjectId format:", categoryID);
    }
  }

  // Try to find by name
  if (categoryName && typeof categoryName === "string") {
    const name = categoryName.trim();
    if (!name) {
      console.log("⚠️ Category name is empty after trim");
      return null;
    }

    // Case-insensitive name match
    const byName = await Category.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
    if (byName) {
      console.log("✅ Found category by name:", byName.name);
      return byName;
    } else {
      console.log("❌ Category not found with name:", name);
    }
  }

  console.log("❌ Could not find category with provided identifiers");
  return null;
};

const registerVehicle = asyncHandler(async (req, res) => {
  const userDetails = req.user;

  console.log('🚗 Vehicle Registration Attempt:', {
    userId: userDetails._id,
    username: userDetails.username,
    typeOfCustomer: userDetails.typeOfCustomer,
    hasOwnerID: !!userDetails.ownerID,
  });

  // CRITICAL: Only Owners can register/list vehicles
  // Customers (Buyers) can ONLY book vehicles, they CANNOT list vehicles
  if (userDetails.typeOfCustomer !== "Owner") {
    console.log('❌ Vehicle registration denied: User is not an Owner');
    throw new ApiError(
      403,
      `Access Denied: Only owners can list vehicles for rent. You are registered as a ${userDetails.typeOfCustomer}. Customers can only book vehicles, not list them. To list vehicles, you must register as an owner.`
    );
  }

  // Ensure owner profile is completed
  if (!userDetails.ownerID) {
    console.log('❌ Vehicle registration denied: Owner profile incomplete');
    throw new ApiError(403, "Owner profile not completed. Please register as an owner first before listing vehicles.");
  }

  console.log('✅ Vehicle registration authorized: User is verified Owner');

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

  // Log received data for debugging
  console.log("📝 Received vehicle registration data:", { name, description, price, stock, category, categoryID });

  if (!name || !description || price == null || stock == null) {
    // delete temp file on early exit
    if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath);
    throw new ApiError(400, "All fields are required: name, description, price, and stock");
  }

  // Validate that at least one category identifier is provided
  if (!category && !categoryID) {
    if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath);
    throw new ApiError(400, "Category is required. Please provide either category name or categoryID");
  }

  // basic numeric validation
  const priceUSD = Number(price);
  const stockNum = Number(stock);
  if (!Number.isFinite(priceUSD) || priceUSD < 0) {
    if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath);
    throw new ApiError(400, "Invalid price. Price must be a positive number in USD.");
  }
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath);
    throw new ApiError(400, "invalid stock");
  }

  // Convert USD to INR
  let priceINR;
  try {
    priceINR = convertUSDtoINR(priceUSD);
  } catch (error) {
    if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath);
    throw new ApiError(400, "Error converting currency: " + error.message);
  }

  const existingVehicle = await Vehicle.findOne({ name: { $regex: `^${name.trim()}$`, $options: "i" } });
  if (existingVehicle) {
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
    throw new ApiError(400, "Vehicle already exists");
  }

  // Find category with detailed logging
  console.log("🔍 Searching for category with:", { categoryID, categoryName: category });
  const categoryDoc = await findCategoryFlexible({
    categoryID,
    categoryName: category,
  });

  if (!categoryDoc) {
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}

    // Get all available categories to help with debugging
    const availableCategories = await Category.find({}).select('name');
    const categoryNames = availableCategories.map(c => c.name).join(', ');

    throw new ApiError(
      400,
      `Invalid category. Received: "${category || categoryID}". Available categories: ${categoryNames || 'No categories found in database'}`
    );
  }

  console.log("✅ Category found:", categoryDoc.name);

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
    priceUSD: priceUSD,
    priceINR: priceINR,
    price: priceINR, // For backward compatibility, store INR price
    stock: stockNum,
    categoryID: categoryDoc._id,
    image: image?.url,
  });

  if (!vehicle) throw new ApiError(500, "Failed to register the vehicle on the database");

  return res
    .status(200)
    .json(new ApiResponse(200, `Vehicle registered successfully. Price: $${priceUSD} USD (₹${priceINR} INR at rate 1 USD = ₹${getExchangeRate()})`, vehicle));
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
  const userDetails = req.user;

  // Strict check: Only Owners can delete vehicles
  if (userDetails.typeOfCustomer !== "Owner") {
    throw new ApiError(403, "Only owners can delete vehicles. Customers cannot delete vehicles.");
  }

  if (!vehicleId) throw new ApiError(404, "vehicleId is required");

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  // Check if the logged-in user is the owner of this vehicle
  if (!userDetails.ownerID || vehicle.ownerID.toString() !== userDetails.ownerID.toString()) {
    throw new ApiError(403, "You are not authorized to delete this vehicle. You can only delete your own vehicles.");
  }

  await Vehicle.findByIdAndDelete(vehicleId);
  await Cart.updateMany({}, { $pull: { items: { vehicleID: vehicleId } } });
  return res.status(200).json(new ApiResponse(200, "Vehicle deleted and removed from all carts"));
});

// Get all vehicles owned by the logged-in owner
const getOwnerVehicles = asyncHandler(async (req, res) => {
  const userDetails = req.user;
  const ownerID = userDetails.ownerID;

  // Strict check: Only Owners can view their vehicles
  if (userDetails.typeOfCustomer !== "Owner") {
    throw new ApiError(403, "Only owners can view their listed vehicles. Customers cannot access this endpoint.");
  }

  if (!ownerID) {
    throw new ApiError(400, "Owner profile not completed. Please register as an owner first.");
  }

  const vehicles = await Vehicle.find({ ownerID })
    .populate("categoryID", "name")
    .populate("ownerID", "storeName gstNumber address")
    .exec();

  return res.status(200).json(new ApiResponse(200, "Owner vehicles fetched successfully", vehicles));
});

// Update vehicle (only by owner)
const updateVehicle = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const userDetails = req.user;

  // Strict check: Only Owners can update vehicles
  if (userDetails.typeOfCustomer !== "Owner") {
    throw new ApiError(403, "Only owners can update vehicles. Customers cannot update vehicles.");
  }

  if (!vehicleId) throw new ApiError(400, "Vehicle ID is required");

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  // Check if the logged-in user is the owner of this vehicle
  if (!userDetails.ownerID || vehicle.ownerID.toString() !== userDetails.ownerID.toString()) {
    throw new ApiError(403, "You are not authorized to update this vehicle. You can only update your own vehicles.");
  }

  const { name, description, price, stock, category, categoryID } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description.trim();
  if (price !== undefined) {
    const priceUSD = Number(price);
    if (!Number.isFinite(priceUSD) || priceUSD < 0) {
      throw new ApiError(400, "Invalid price. Price must be a positive number in USD.");
    }

    // Convert USD to INR
    try {
      const priceINR = convertUSDtoINR(priceUSD);
      updateData.priceUSD = priceUSD;
      updateData.priceINR = priceINR;
      updateData.price = priceINR; // For backward compatibility
    } catch (error) {
      throw new ApiError(400, "Error converting currency: " + error.message);
    }
  }
  if (stock !== undefined) {
    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      throw new ApiError(400, "Invalid stock");
    }
    updateData.stock = stockNum;
  }

  // Handle category update
  if (category || categoryID) {
    const categoryDoc = await findCategoryFlexible({ categoryID, categoryName: category });
    if (!categoryDoc) {
      throw new ApiError(400, "Invalid category or category does not exist");
    }
    updateData.categoryID = categoryDoc._id;
  }

  // Handle image update if provided
  if (req.files?.image?.[0]) {
    const imageLocalPath = req.files.image[0].path;
    try {
      const image = await uploadToCloudinary(imageLocalPath);
      if (image?.url) {
        updateData.image = image.url;
      }
    } catch (e) {
      try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
      throw new ApiError(500, "Image failed to upload on cloudinary");
    } finally {
      try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
    }
  }

  const updatedVehicle = await Vehicle.findByIdAndUpdate(
    vehicleId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate("categoryID", "name")
    .populate("ownerID", "storeName gstNumber address")
    .exec();

  return res.status(200).json(new ApiResponse(200, "Vehicle updated successfully", updatedVehicle));
});

export { registerVehicle, vehicleDetails, allVehicles, vehicleByID, deleteVehicle, getOwnerVehicles, updateVehicle };
