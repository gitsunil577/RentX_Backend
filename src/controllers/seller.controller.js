import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Seller } from "../models/datamodels/seller.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/datamodels/user.model.js";


const registerSeller = asyncHandler(async(req,res) => {
    const userDetails = req.user
    if(userDetails.sellerID){
        throw new ApiError(400,"Seller  already Exists ")
    }
    const {storeName,gstNumber,address}=req.body;
    if(!storeName || !gstNumber || !address){
        throw new ApiError(400,"All fields are required")
    }
    const existingUser = await Seller.findOne({storeName})
    if(existingUser){
        throw new ApiError(400,"User already exists")
    }
    const seller = await Seller.create({
        storeName,
        gstNumber,
        address
    })
    if(!seller){
        throw new ApiError(400,"user registration failed or something went wrong")
    }
    
    const user = await User.findByIdAndUpdate(
        userDetails._id,
        {
            typeOfCustomer: "Seller",
            sellerID: seller._id
        },
        {
            new: true
        }
    ).select('-password -refreshToken');
    if(!user){
        throw new ApiError(500,"Error in connecting to the database ")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,"Seller registered successfully",{seller,user})
    )
})

const sellerDetails = asyncHandler(async(req,res) => {
    const user= req.user
    const sellerID = user.sellerID
    return res
    .status(200)
    .json(
        new ApiResponse(200,"seller details fetched successfully",await Seller.findById(sellerID))
    )
})



export { registerSeller, sellerDetails};