import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Seller } from "../models/datamodels/seller.model.js";
import { Product } from "../models/datamodels/product.model.js";
import { Category } from "../models/datamodels/category.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs";
// If you use Cart in deleteProduct, import it:
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

const registerProduct = asyncHandler(async (req, res) => {
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

  const existingProduct = await Product.findOne({ name: { $regex: `^${name.trim()}$`, $options: "i" } });
  if (existingProduct) {
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
    throw new ApiError(400, "Product already exists");
  }

  const categoryDoc = await findCategoryFlexible({
    categoryID,
    categoryName: category,
  });

  if (!categoryDoc) {
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
    throw new ApiError(400, "invalid category or category does not exist");
  }

  const sellerID = userDetails?.sellerID;
  if (!sellerID) {
    try { if (fs.existsSync(imageLocalPath)) fs.unlinkSync(imageLocalPath); } catch {}
    throw new ApiError(400, "Seller is not registered");
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

  const product = await Product.create({
    sellerID,
    name: name.trim(),
    description: description.trim(),
    price: priceNum,
    stock: stockNum,
    categoryID: categoryDoc._id,
    image: image?.url,
  });

  if (!product) throw new ApiError(500, "Failed to register the product on the database");

  return res
    .status(200)
    .json(new ApiResponse(200, "Product registered successfully", product));
});

// unchanged endpoints, but keep populate
const productDetails = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name && !description) throw new ApiError(400, "at least one field is required");

  const queryConditions = [];
  if (name && typeof name === "string") queryConditions.push({ name: { $regex: name, $options: "i" } });
  if (description && typeof description === "string") queryConditions.push({ description: { $regex: description, $options: "i" } });

  const products = await Product.find({ $or: queryConditions })
    .populate("categoryID", "name")
    .populate("sellerID", "storeName gstNumber address")
    .exec();

  return res.status(200).json(new ApiResponse(200, "product fetched successfully", products));
});

const allProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .populate("categoryID", "name")
    .populate("sellerID", "storeName gstNumber address")
    .exec();

  return res.status(200).json(new ApiResponse(200, "All the products fetched successfully", products));
});

const productByID = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Product ID is required.");

  const product = await Product.findById(id)
    .populate("categoryID", "name")
    .populate("sellerID", "storeName gstNumber address")
    .exec();

  if (!product) throw new ApiError(404, "Product not found.");
  return res.status(200).json(new ApiResponse(200, "Product fetched successfully", product));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) throw new ApiError(404, "productId is required");

  const product = await Product.findByIdAndDelete(productId);
  if (!product) throw new ApiError(404, "product not found or error in deleting from database");

  await Cart.updateMany({}, { $pull: { items: { productID: productId } } });
  return res.status(200).json(new ApiResponse(200, "Product deleted and removed from all carts"));
});

export { registerProduct, productDetails, allProducts, productByID, deleteProduct };
