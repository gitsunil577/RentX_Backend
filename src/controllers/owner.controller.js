import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Owner } from "../models/datamodels/owner.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/datamodels/user.model.js";


const registerOwner = asyncHandler(async(req,res) => {
    const userDetails = req.user
    if(userDetails.ownerID){
        throw new ApiError(400,"Owner already Exists ")
    }
    const {storeName,gstNumber,address}=req.body;
    if(!storeName || !gstNumber || !address){
        throw new ApiError(400,"All fields are required")
    }
    const existingUser = await Owner.findOne({storeName})
    if(existingUser){
        throw new ApiError(400,"User already exists")
    }
    const owner = await Owner.create({
        storeName,
        gstNumber,
        address
    })
    if(!owner){
        throw new ApiError(400,"user registration failed or something went wrong")
    }

    const user = await User.findByIdAndUpdate(
        userDetails._id,
        {
            typeOfCustomer: "Owner",
            ownerID: owner._id
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
        new ApiResponse(200,"Owner registered successfully",{owner,user})
    )
})

const ownerDetails = asyncHandler(async(req,res) => {
    const user= req.user
    const ownerID = user.ownerID
    return res
    .status(200)
    .json(
        new ApiResponse(200,"owner details fetched successfully",await Owner.findById(ownerID))
    )
})



export { registerOwner, ownerDetails};
