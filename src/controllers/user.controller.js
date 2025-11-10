import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/datamodels/user.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

// ---------------- TOKEN GENERATOR ----------------
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

// ---------------- REGISTER ----------------
const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullname, typeOfCustomer } = req.body;
  if ([email, username, password, fullname].some((field) => !field)) {
    throw new ApiError(400, 'All fields are required');
  }

  // Validate typeOfCustomer if provided
  if (typeOfCustomer && !['Buyer', 'Owner'].includes(typeOfCustomer)) {
    throw new ApiError(400, 'Invalid user type. Must be either Buyer or Owner');
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new ApiError(400, 'User already exists');
  }

  const user = await User.create({
    email,
    username,
    password,
    fullname,
    typeOfCustomer: typeOfCustomer || 'Buyer', // Default to Buyer if not specified
  });

  const createdUser = await User.findById(user._id).select('-password -refreshToken');
  if (!createdUser) {
    throw new ApiError(500, 'User not created');
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, 'User registered successfully'));
});

// ---------------- LOGIN ----------------
const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new ApiError(400, 'Username/email and password required');
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const passwordCheck = await user.isPasswordCorrect(password);
  if (!passwordCheck) {
    throw new ApiError(401, 'Incorrect password');
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

  // Cookies configuration - adjusted for cross-origin development
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true only in production (HTTPS)
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' for production cross-origin
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  };

  // Set cookies for access and refresh tokens
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res.status(200).json(
    new ApiResponse(
      200,
      { user: loggedInUser, accessToken, refreshToken },
      'User logged in successfully'
    )
  );
});

// ---------------- LOGOUT ----------------
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: '' } });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    path: '/',
  };

  res
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions);

  return res.status(200).json(new ApiResponse(200, {}, 'User logged out successfully'));
});

// ---------------- REFRESH TOKEN ----------------
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken =
    req.cookies?.refreshToken ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!incomingToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  try {
    const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);

    if (!user || user.refreshToken !== incomingToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        'Access token refreshed successfully'
      )
    );
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
});

// ---------------- CHANGE PASSWORD ----------------
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'All fields required');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const passwordCheck = await user.isPasswordCorrect(oldPassword);
  if (!passwordCheck) throw new ApiError(400, 'Old password incorrect');

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});

// ---------------- CURRENT USER ----------------
const getCurrentUser = asyncHandler(async (req, res) => {
  // Add detailed user info for debugging
  const userInfo = {
    ...req.user.toObject(),
    isOwner: req.user.typeOfCustomer === 'Owner',
    isBuyer: req.user.typeOfCustomer === 'Buyer',
    hasOwnerProfile: !!req.user.ownerID,
  };

  console.log('👤 Current User Info:', {
    id: userInfo._id,
    username: userInfo.username,
    email: userInfo.email,
    typeOfCustomer: userInfo.typeOfCustomer,
    ownerID: userInfo.ownerID,
  });

  return res.status(200).json(new ApiResponse(200, userInfo, 'User fetched successfully'));
});

// ---------------- UPDATE USERNAME ----------------
const updateUserName = asyncHandler(async (req, res) => {
  const { oldUsername, newUsername } = req.body;
  if (!oldUsername || !newUsername) {
    throw new ApiError(400, 'All fields required');
  }

  const user = req.user;
  if (user.username !== oldUsername) {
    throw new ApiError(400, 'Old username incorrect');
  }

  user.username = newUsername;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, 'Username updated successfully'));
});

// ---------------- AVATAR UPLOAD ----------------
const uploadAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required');
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, 'Avatar upload failed');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select('-password -refreshToken');

  if (!user) throw new ApiError(404, 'User not found');

  return res.status(200).json(new ApiResponse(200, user, 'Avatar uploaded successfully'));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserName,
  uploadAvatar,
};
