import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  fullname: String,
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v) {
        // Allow empty/null values, but if provided, validate format
        if (!v) return true;
        // Accepts formats: +1234567890, +12 1234567890, +12-123-456-7890, etc.
        return /^\+?[1-9]\d{1,14}$/.test(v.replace(/[\s-]/g, ''));
      },
      message: props => `${props.value} is not a valid phone number! Use international format (e.g., +919876543210)`
    }
  },
  refreshToken: { type: String },
  avatar: String,
  typeOfCustomer: { type: String, enum: ["Buyer", "Owner"], default: "Buyer" },
  ownerID: { type: mongoose.Schema.Types.ObjectId, ref: "Owner" },
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpiry: { type: Date }
});

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

export const User = mongoose.model("User", userSchema);
