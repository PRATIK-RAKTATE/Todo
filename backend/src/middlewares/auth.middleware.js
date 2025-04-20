import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { findUser } from "../utils/FindUser.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        const user = await findUser(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        // console.log(user)
    
        req.user = user;
        req.mainId = decodedToken?._id;
        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            // Signal that token is expired, but let the next middleware handle refresh logic
            req.isAccessTokenExpired = true;
            console.log("access Token is expired");
            next();
        } else {
            throw new ApiError(401, error?.message || "Invalid access token");
        }
    }
});