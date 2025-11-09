import mongoose from "mongoose";

const bookingitemsSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    pricePerDay: {
        type: Number,
        required: true,
        min: 0,
        // Price per day in INR (Indian Rupees)
    },
    numberOfDays: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
        // Total price in INR (pricePerDay × numberOfDays)
    }
},{timestamps: true});


export const Bookingitems = mongoose.model('Bookingitems', bookingitemsSchema);
