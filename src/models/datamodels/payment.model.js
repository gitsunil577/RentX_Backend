import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ["Credit Card", "Debit Card", "Net Banking", "UPI", "Wallet", "Cash"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Success", "Failed", "Refunded"],
        required: true,
        default: "Pending"
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
        // Payment amount in INR (Indian Rupees)
        // Note: Vehicle prices are entered in USD by owners but automatically converted to INR
        // All transactions are processed in INR through Razorpay
    },
    transactionId: {
        type: String
    }
},{timestamps: true});


export const Payment = mongoose.model('Payment', paymentSchema);
