import mongoose from "mongoose";

const ownerSchema = new mongoose.Schema({
    storeName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    gstNumber: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: false,
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
    notificationPreferences: {
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: true }
    }
},{timestamps: true});


export const Owner = mongoose.model('Owner', ownerSchema)
