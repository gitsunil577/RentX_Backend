import { asyncHandler } from "../utils/asyncHandler.js";
import { Category } from "../models/datamodels/category.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).sort({ name: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, "Categories fetched successfully", categories));
});

const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Category ID is required");

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");

  return res
    .status(200)
    .json(new ApiResponse(200, "Category fetched successfully", category));
});

export { getAllCategories, getCategoryById };
