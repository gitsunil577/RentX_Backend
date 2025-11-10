import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/datamodels/user.model.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Extract tokens from cookie or Authorization header
    const cookieToken = req.cookies?.accessToken;
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken;

    if (!token) {
      throw new ApiError(401, 'Unauthorized request: No token found');
    }

    // Verify JWT token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // IMPORTANT: Always fetch fresh user data from database
    // This ensures we have the latest typeOfCustomer and ownerID
    // even if the token was issued before a role change
    const user = await User.findById(decodedToken?._id).select('-password -refreshToken');
    if (!user) {
      throw new ApiError(401, 'Invalid Access Token: User not found');
    }

    // Log user data for debugging
    console.log('🔑 JWT Verified - User:', {
      id: user._id,
      username: user.username,
      typeOfCustomer: user.typeOfCustomer,
      ownerID: user.ownerID ? 'exists' : 'null',
    });

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid access token');
  }
});

// Middleware to check if user is an Owner
export const isOwner = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  console.log('🔒 isOwner middleware check:', {
    userId: req.user._id,
    typeOfCustomer: req.user.typeOfCustomer,
    ownerID: req.user.ownerID,
  });

  if (req.user.typeOfCustomer !== 'Owner') {
    console.log('❌ Access denied: User is not an Owner, type:', req.user.typeOfCustomer);
    throw new ApiError(403, `Access denied. Only owners can perform this action. You are registered as: ${req.user.typeOfCustomer}`);
  }

  if (!req.user.ownerID) {
    console.log('❌ Access denied: Owner profile not completed');
    throw new ApiError(403, 'Owner profile not completed. Please register as an owner first');
  }

  console.log('✅ isOwner check passed');
  next();
});

// Middleware to check if user is a Buyer
export const isBuyer = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  console.log('🔒 isBuyer middleware check:', {
    userId: req.user._id,
    typeOfCustomer: req.user.typeOfCustomer,
  });

  if (req.user.typeOfCustomer !== 'Buyer') {
    console.log('❌ Access denied: User is not a Buyer, type:', req.user.typeOfCustomer);
    throw new ApiError(403, `Access denied. Only buyers/customers can perform this action. You are registered as: ${req.user.typeOfCustomer}`);
  }

  console.log('✅ isBuyer check passed');
  next();
});

// Middleware to check if user is either Owner or Buyer (authenticated user)
export const isAuthenticated = verifyJWT;
