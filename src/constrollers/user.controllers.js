import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();

    user.RefreshToken = RefreshToken;
    await user.save();
    return { AccessToken, RefreshToken };
};

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
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }

    const profileImageLocalPath = req.files?.profileImage[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!profileImageLocalPath) {
        throw new ApiError(400, "Profile image is required")
    }

    const profileImage = await uploadOnCloudinary(profileImageLocalPath)

    if (!profileImage || !profileImage.url) {
        throw new ApiError(400, " ProfileImage upload failed")
    }

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage || !coverImage.url) {
        throw new ApiError(400, " CoverImage upload failed")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        profileImage: profileImage?.url || "",
        coverImage: coverImage.url
    })
    if (!user || !user._id) {
        throw new ApiError(500, "User creation failed")
    }

    const createUser = await User.findById(user._id).select("-password -RefreshToken ")

    if (!createUser) {
        throw new ApiError(500, "User creation failed")
    }

    return res.status(201).json(new ApiResponse(201, createUser, "User created successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    // get email, username and password from request body
    // validation - not empty
    // check if user exist with given email or username
    // if not exist send error
    // if exist check for password correctness
    // if not correct send error
    // if correct generate access token and refresh token 
    // save refresh token in db
    // return response with user details and access token without password and refresh token 

    const { email, username, password } = req.body

    if (!email && !username) {
        throw new ApiError(400, "Email or username is required")
    }

    const user = await User.findOne({
        $or: [{ email: email?.toLowerCase() }, { username: username?.toLowerCase() }]
    })

    if (!user || !user._id) {
        throw new ApiError(404, "User not found with given credentials")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Password is incorrect")
    }

    const AccessToken = user.generateAccessToken()
    const RefreshToken = user.generateRefreshToken()
    user.RefreshToken = RefreshToken
    await user.save()

    const loggedInUser = await User.findById(user._id).select("-password -RefreshToken ")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("RefreshToken", RefreshToken, options)
        .cookie("AccessToken", AccessToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, AccessToken }, "User logged in successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    // get user id from req.user
    // find user from db using id
    // if user not found send error
    // create a auth middleware to populate req.user from access token 
    // if user found remove refresh token from db
    // send response

    const userId = req.user._id

    const user = await User.findById(userId)

    if (!user || !user._id) {
        throw new ApiError(404, "User not found")
    }

    user.updateOne({
        $unset: { RefreshToken: 1 }
    }, { new: true })

    const options = {
        httpOnly: true,
        secure: true,
       
    }

    return res
    .status(200)
    .clearCookie("RefreshToken", options)
    .clearCookie("AccessToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler( async ( req, res) => {
    // get refresh token from cookie
    // validate refresh token
    // if not valid send error
    // if valid get user id from token payload
    // find user from db using id
    // if user not found send error
    // if user found generate new access token
    // send response with new access token

    const userIncomingRefreshToken = req.cookies?.RefreshToken || req.headers?.authorization?.split(" ")[1];

    if (!userIncomingRefreshToken) {
        throw new ApiError(401, " User's Refresh Token is missing");
    }
    const decoded = Jwt.verify(userIncomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded._id).select("-password -RefreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if (user.RefreshToken !== userIncomingRefreshToken) {
        throw new ApiError(401, "Invalid Refresh Token");
    }

    const {AccessToken, RefreshToken} = await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("RefreshToken", RefreshToken, options)
        .cookie("AccessToken", AccessToken, options)
        .json(new ApiResponse(200, { AccessToken }, "Access Token refreshed successfully"));

});

const changePassword = asyncHandler( async ( req, res) => {
    // get old password and new password from request body
    // get user id from req.user
    // find user from db using id
    // if user not found send error
    // if user found check for old password correctness
    // if not correct send error
    // if correct hash new password and update user password in db
    // send response

    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user || !user._id) {
        throw new ApiError(404, "User not found");
    }

    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isOldPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: true});

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully")); 

});

const updateAccountDetails = asyncHandler( async ( req, res ) => {
    // get user details from the request body
    // get user id from req.user
    // find user from db using id 
    // if user not found throw error 
    // if user found update user details in db
    // send response

    const { fullname , email,username} = req.body;
    if ([fullname , email, username].some((fields) => fields?.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(req.user?._id , {
        $set: {
            fullname, email, username
        }
    },{new: true}).select("-password")

    if (!user || !user._id){
        throw new ApiError (404, "User not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user , "User details updated successfully"));
        
})

const updateProfileImage = asyncHandler( async (req, res ) => {
    // get profile image path from req.file
    // get user id from req.user
    // find user from db using id
    // if user not found throw error
    // if user found upload image to cloudinary
    // update user profile image in db 
    const profileImageLocalPath = req.file?.path;
    if (!profileImageLocalPath){
        throw new ApiError (400, "Profile image is required");
    }

    const profileImage = await uploadOnCloudinary (profileImageLocalPath)
    if (!profileImage || !profileImage.url){
        throw new ApiError (500, "Profile image upload failed");
    }

    const user = await User.findByIdAndUpdate ( req.user?._id , {
        $set: {
            profileImage: profileImage.url
        }
    }, { new: true}).select ("-password");

    if (!user || !user._id){
        throw new ApiError (404, "User not found");
    }

    return res
    .status (200)
    .json ( new ApiResponse (200, user , "Profile image updated successfully"));

})

const updateCoverImage = asyncHandler ( async (req, res ) => {
    // get cover image path from req.file
    // check if file is present
    // get user id from req.user
    // find user from db using id
    // if user not found throw error 
    // if user found upload image to cloudinary 
    // update user cover image in db 
    // return response

    const coverImageLocalPath = req.file?.path;
    if( !coverImageLocalPath){
        throw new ApiError (400, "Cover image is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if ( !coverImage || ! coverImage.url){
        throw new ApiError (500, "Cover image upload failed");
    }

    const user  = await User.findByIdAndUpdate ( req.user?._id,{
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true}).select ("-password");

    if ( !user || ! user._id){
        throw new ApiError (404, "User not found");
    }

    return res
    .status (200)
    .json ( new ApiResponse (200, user , "Cover image updated successfully"));

})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword , updateAccountDetails, updateProfileImage , updateCoverImage };