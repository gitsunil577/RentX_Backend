import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Owner } from "../models/datamodels/owner.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/datamodels/user.model.js";

// Token generator (same as in user.controller.js)
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log('Error generating tokens:', error);
    throw new ApiError(500, 'Error while generating tokens');
  }
};


const registerOwner = asyncHandler(async(req,res) => {
    const userDetails = req.user;

    console.log('🏪 Owner Registration Attempt:', {
        userId: userDetails._id,
        currentType: userDetails.typeOfCustomer,
        hasOwnerID: !!userDetails.ownerID,
    });

    // Check if owner profile already exists
    if (userDetails.ownerID) {
        throw new ApiError(400, "Owner profile already exists. You are already registered as an owner.");
    }

    // IMPORTANT: Allow users who registered as "Owner" during signup
    // If user is still "Buyer", upgrade them to "Owner" (for flexibility)
    if (userDetails.typeOfCustomer !== "Owner") {
        console.log('⚠️ User is Buyer, upgrading to Owner...');

        // Check if user has any active bookings (they shouldn't become owner if they have bookings)
        const { Booking } = await import("../models/datamodels/booking.model.js");
        const activeBookings = await Booking.find({
            userId: userDetails._id,
            status: { $in: ["Pending", "Confirmed", "Ongoing"] }
        });

        if (activeBookings.length > 0) {
            throw new ApiError(403, "Cannot become an owner while you have active bookings. Please complete or cancel your bookings first.");
        }
    }

    const { storeName, gstNumber, address, phoneNumber } = req.body;
    if (!storeName || !gstNumber || !address) {
        throw new ApiError(400, "All fields are required: storeName, gstNumber, and address");
    }

    // Check if store name already exists
    const existingOwner = await Owner.findOne({ storeName });
    if (existingOwner) {
        throw new ApiError(400, "Store name already exists. Please choose a different store name.");
    }

    // Create owner profile
    const owner = await Owner.create({
        storeName,
        gstNumber,
        address,
        phoneNumber: phoneNumber || undefined, // Optional phone number
    });

    if (!owner) {
        throw new ApiError(500, "Owner registration failed. Something went wrong.");
    }

    // Update user with owner reference AND change type to Owner
    const user = await User.findByIdAndUpdate(
        userDetails._id,
        {
            ownerID: owner._id,
            typeOfCustomer: "Owner" // Ensure type is set to Owner
        },
        {
            new: true
        }
    ).select('-password -refreshToken');

    if (!user) {
        throw new ApiError(500, "Error updating user with owner profile");
    }

    console.log('✅ Owner registered successfully:', {
        userId: user._id,
        newType: user.typeOfCustomer,
        ownerID: user.ownerID,
    });

    // CRITICAL: Generate NEW tokens with updated user data
    // This ensures the token reflects the new "Owner" role immediately
    console.log('🔄 Generating new tokens with Owner role...');
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    // Set cookies with new tokens
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    console.log('✅ New tokens generated and set in cookies');

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Owner registered successfully! Your role has been updated immediately. New authentication tokens have been issued.", {
            owner,
            user,
            accessToken,  // Return tokens so frontend can update localStorage
            refreshToken,
            message: "IMPORTANT: Your session has been automatically updated. You are now an Owner and can list vehicles immediately. You can no longer book vehicles."
        })
    );
})

const ownerDetails = asyncHandler(async(req,res) => {
    const user = req.user;
    const ownerID = user.ownerID;

    // Strict check: Only Owners can view owner details
    if (user.typeOfCustomer !== "Owner") {
        throw new ApiError(403, "Only owners can view owner details. Customers cannot access this endpoint.");
    }

    if (!ownerID) {
        throw new ApiError(400, "Owner profile not found. Please complete owner registration first.");
    }

    const ownerDetails = await Owner.findById(ownerID);
    if (!ownerDetails) {
        throw new ApiError(404, "Owner profile not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Owner details fetched successfully", ownerDetails)
    );
})

// Update owner profile (phone number, address, etc.)
const updateOwnerProfile = asyncHandler(async(req, res) => {
    const user = req.user;
    const ownerID = user.ownerID;

    // Strict check: Only Owners can update owner profile
    if (user.typeOfCustomer !== "Owner") {
        throw new ApiError(403, "Only owners can update owner profile.");
    }

    if (!ownerID) {
        throw new ApiError(400, "Owner profile not found. Please complete owner registration first.");
    }

    const { phoneNumber, address, storeName, notificationPreferences } = req.body;

    if (!phoneNumber && !address && !storeName && !notificationPreferences) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateData = {};
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address) updateData.address = address;
    if (storeName) updateData.storeName = storeName;
    if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;

    const owner = await Owner.findByIdAndUpdate(
        ownerID,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!owner) {
        throw new ApiError(404, "Owner profile not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Owner profile updated successfully", owner)
    );
})

export { registerOwner, ownerDetails, updateOwnerProfile };
