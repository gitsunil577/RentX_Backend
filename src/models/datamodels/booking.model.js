import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true
    },
    bookingDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Ongoing", "Completed", "Cancelled"],
        required: true,
        default: "Pending"
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
        // Total booking amount in INR (Indian Rupees)
        // Calculated as: numberOfDays × vehicle.priceINR
    },
    pickupLocation: {
        type: String,
        required: true
    },
    returnLocation: {
        type: String,
        required: true
    },
    numberOfDays: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Refunded"],
        default: "Pending"
    },
    invoiceNumber: {
        type: String,
        // Generated when payment is confirmed
        // Format: RENTX-INV-XXXXXX-YYYY
    },
    invoiceGenerated: {
        type: Boolean,
        default: false
    },
    invoiceGeneratedAt: {
        type: Date
    }
},{timestamps: true});


export const Booking = mongoose.model('Booking', bookingSchema);
