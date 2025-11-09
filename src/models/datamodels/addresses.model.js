import mongoose from "mongoose";


const addressSchema = new mongoose.Schema({
userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
},
street: {
    type: String
},
city: {
    type: String
},
state: {
    type: String
},
pincode: {
    type: Number
}

});

export const Address = mongoose.model('Address', addressSchema);