import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontened
    // user validation-not empty
    // check if user already exists: username , email
    // check for images , check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response 


    const { username, email, fullname, password } = req.body

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All feilds are required")
    }

    const existedUser = await User.findOne({
        $or: [{username} , {email}]
    })

    if(existedUser){
       throw new ApiError(409, "User with email or username already exist")
    }

    const profileImageLocalPath = req.files?.profileImage[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!profileImageLocalPath){
        throw new ApiError(400, "Profile image is required")
    }

    const profileImage = await uploadOnCloudinary(profileImageLocalPath)

    if(!profileImage || !profileImage.url){
        throw new ApiError(400 , " ProfileImage upload failed")
    }

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage || !coverImage.url){
        throw new ApiError(400 , " CoverImage upload failed")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        profileImage: profileImage?.url || "",
        coverImage: coverImage.url
    })
    if(!user || !user._id){
        throw new ApiError(500 , "User creation failed")
    }
    
    const createUser = await User.findById(user._id).select("-password -RefreshToken ")

    if(!createUser){
        throw new ApiError(500 , "User creation failed")
    }

    return res.status(201).json(new ApiResponse(201,  createUser, "User created successfully"))
})

export { registerUser }