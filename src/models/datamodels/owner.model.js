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
        required: false
    },
    notificationPreferences: {
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: true }
    }
},{timestamps: true});


export const Owner = mongoose.model('Owner', ownerSchema)
