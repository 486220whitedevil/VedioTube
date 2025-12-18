import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";

 export const verifyAccessToken = async (req, res, next) => {
    try {
         const authToken = req.cookies?.AccessToken || req.headers?.authorization?.split(" ")[1];
         if (!authToken) {
             throw new ApiError(401, "Access Token is missing");
         }

        const decoded = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded._id).select("-password -RefreshToken");

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        req.user = user;
        next(); 


        } catch (error) {
            throw new ApiError(401, "Invalid Access Token")
        }
    }