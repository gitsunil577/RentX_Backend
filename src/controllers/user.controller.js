import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/datamodels/user.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendOTPEmail } from '../utils/emailService.js';
import { verifyGoogleToken } from '../config/firebase-admin.js';

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
  const { email, username, password, fullname, typeOfCustomer, phoneNumber } = req.body;
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
    phoneNumber: phoneNumber || undefined, // Optional phone number
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

// ---------------- GOOGLE LOGIN ----------------
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken, email, displayName, photoURL, uid } = req.body;

  if (!idToken) {
    throw new ApiError(400, 'Google ID token is required');
  }

  try {
    // Verify the Google ID token with Firebase Admin
    const decodedToken = await verifyGoogleToken(idToken);

    // Check if the email from the token matches the provided email
    if (decodedToken.email !== email) {
      throw new ApiError(401, 'Token email mismatch');
    }

    // Check if user already exists
    let user = await User.findOne({ email: decodedToken.email });

    if (!user) {
      // Create a new user if they don't exist
      // Generate a username from email or display name
      let username = displayName?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];

      // Check if username already exists, append random string if needed
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        username = `${username}${Math.floor(Math.random() * 10000)}`;
      }

      user = await User.create({
        email: decodedToken.email,
        username,
        fullname: displayName || email.split('@')[0],
        password: crypto.randomBytes(32).toString('hex'), // Random password for Google users
        avatar: photoURL || undefined,
        googleUID: uid,
        typeOfCustomer: 'Buyer', // Default to Buyer
        isGoogleUser: true,
      });

      console.log('New Google user created:', user.email);
    } else {
      // Update existing user's Google info if needed
      if (!user.googleUID) {
        user.googleUID = uid;
        user.isGoogleUser = true;
        if (photoURL && !user.avatar) {
          user.avatar = photoURL;
        }
        await user.save({ validateBeforeSave: false });
      }
      console.log('Existing user logged in via Google:', user.email);
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    // Cookies configuration
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    };

    // Set cookies
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        'Google sign-in successful'
      )
    );
  } catch (error) {
    console.error('Google login error:', error);
    throw new ApiError(401, error.message || 'Google authentication failed');
  }
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

// ---------------- UPDATE PROFILE ----------------
const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, phoneNumber } = req.body;

  if (!fullname && !phoneNumber) {
    throw new ApiError(400, 'At least one field is required to update');
  }

  const updateData = {};
  if (fullname) updateData.fullname = fullname;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) throw new ApiError(404, 'User not found');

  return res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

// ---------------- FORGOT PASSWORD (SEND OTP) ----------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User with this email does not exist');
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Set OTP expiry to 10 minutes from now
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // Save OTP and expiry to user document
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpiry = otpExpiry;
  await user.save({ validateBeforeSave: false });

  // Send OTP via email
  try {
    await sendOTPEmail(user.email, otp, user.fullname || user.username);
    return res.status(200).json(
      new ApiResponse(200, { email: user.email }, 'OTP sent successfully to your email')
    );
  } catch (error) {
    // If email fails, clear OTP from database
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Error sending OTP email:', error);
    throw new ApiError(500, 'Failed to send OTP. Please try again later.');
  }
});

// ---------------- VERIFY OTP ----------------
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if OTP exists
  if (!user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
    throw new ApiError(400, 'No OTP found. Please request a new one.');
  }

  // Check if OTP has expired
  if (new Date() > user.resetPasswordOTPExpiry) {
    // Clear expired OTP
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  // Verify OTP
  if (user.resetPasswordOTP !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }

  // OTP is valid - return success (don't clear OTP yet, need it for password reset)
  return res.status(200).json(
    new ApiResponse(200, { email: user.email }, 'OTP verified successfully')
  );
});

// ---------------- RESET PASSWORD ----------------
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, 'Email, OTP, and new password are required');
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if OTP exists
  if (!user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
    throw new ApiError(400, 'No OTP found. Please request a new one.');
  }

  // Check if OTP has expired
  if (new Date() > user.resetPasswordOTPExpiry) {
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  // Verify OTP
  if (user.resetPasswordOTP !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }

  // Update password and clear OTP fields
  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpiry = undefined;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, 'Password reset successfully. You can now login with your new password.')
  );
});

export {
  registerUser,
  loginUser,
  googleLogin,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserName,
  uploadAvatar,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
