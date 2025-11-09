import mongoose from "mongoose"

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        vehicleID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1
        }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

cartSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export const Cart = mongoose.model("Cart", cartSchema);