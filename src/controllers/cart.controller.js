import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Cart } from "../models/datamodels/cart.model.js";
import { Vehicle } from "../models/datamodels/vehicle.model.js";


const addToCart = asyncHandler(async (req, res) => {
    const { vehicleId, quantity } = req.body;
    const userDetails = req.user;

    if (!vehicleId || !quantity) {
        throw new ApiError(400, "All the fields are required");
    }

    if (!userDetails) {
        throw new ApiError(401, "Unauthorized: Error in fetching user details");
    }

    const userId = userDetails._id;

    // Find the user's cart
    let cart = await Cart.findOne({ userId });

    if (cart) {
        // Cart exists, check if the vehicle is already in the cart
        const itemIndex = cart.items.findIndex(item => item.vehicleID.toString() === vehicleId);

        if (itemIndex > -1) {
            // Vehicle exists, update the quantity
            cart.items[itemIndex].quantity += parseInt(quantity);
        } else {
            // Vehicle doesn't exist, add it to the items array
            cart.items.push({ vehicleID: vehicleId, quantity: parseInt(quantity) });
        }
        await cart.save();
        return res
            .status(200)
            .json(new ApiResponse(200, "Vehicle added to cart successfully", cart));

    } else {
        // Cart doesn't exist, create a new cart
        const newCart = await Cart.create({
            userId: userId,
            items: [{ vehicleID: vehicleId, quantity: parseInt(quantity) }]
        });

        if (!newCart) {
            throw new ApiError(500, "Error in creating the cart");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, "Vehicle added to cart successfully", newCart));
    }
});


const getCart = asyncHandler(async (req, res) => {
    const userDetails = req.user;

    if (!userDetails) {
      throw new ApiError(401, "Unauthorized: User not found");
    }

    const userId = userDetails._id;

    const cart = await Cart.findOne({ userId }).populate("items.vehicleID");

    if (!cart || cart.items.length === 0) {
      return res.status(200).json(new ApiResponse(200, "Cart is empty", []));
    }

    const formattedCart = cart.items
  .filter(item => item.vehicleID !== null)  // Filter out deleted vehicles
  .map(item => ({
    vehicleId: item.vehicleID._id,
    vehicleName: item.vehicleID.name,
    vehicleImage: item.vehicleID.image,
    price: item.vehicleID.price,
    quantity: item.quantity
  }));

    return res.status(200).json(new ApiResponse(200, "Cart fetched successfully", formattedCart));
  });
  
  const removeItemFromCart = asyncHandler(async (req, res) => {
    const userDetails = req.user;
    const { vehicleId } = req.body;

    if (!userDetails) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

    if (!vehicleId) {
        throw new ApiError(400, "Vehicle ID is required");
    }

    const userId = userDetails._id;

    // Find the cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    const itemIndex = cart.items.findIndex(
        item => item.vehicleID.toString() === vehicleId
    );

    if (itemIndex === -1) {
        throw new ApiError(404, "Vehicle not found in cart");
    }

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);
    await cart.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Vehicle removed from cart successfully", cart));
});

const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const userDetails = req.user;
    const { vehicleId, quantity } = req.body;

    if (!userDetails) {
      throw new ApiError(401, "Unauthorized: User not found");
    }

    if (!vehicleId || typeof quantity !== "number") {
      throw new ApiError(400, "Vehicle ID and quantity are required");
    }

    if (quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1");
    }

    const userId = userDetails._id;

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    // Locate the item
    const itemIndex = cart.items.findIndex(
      item => item.vehicleID.toString() === vehicleId
    );
    if (itemIndex === -1) {
      throw new ApiError(404, "Vehicle not found in cart");
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Quantity updated successfully", cart));
  });
export { addToCart, getCart, removeItemFromCart, updateCartItemQuantity };