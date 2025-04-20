import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Skill} from "../models/skill.model.js"
import { Student } from "../models/student.model.js";
import { Staff } from "../models/staff.model.js";
// import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { domainsWithSkills } from "../utils/Constants.js";


const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const { name, email, password, role  } = req.body
    //console.log("email: ", email);

    if (
        [name, email, password, role].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({ email })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log( userId);

    const user = await User.create({
        name,
        email,
        password,
        role,
        childId: "none"
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        // new ApiResponse(200, createdUser, "User registered Successfully")
        new ApiResponse(200, {}, "User registered Successfully")
    )

})

const bulkRegisterUsers = asyncHandler(async (req, res) => {
    const users = req.body; // Expecting an array of user objects

    if (!Array.isArray(users) || users.length === 0) {
        throw new ApiError(400, "Request body must be a non-empty array of user objects");
    }

    const results = {
        success: [], // will hold registered user info
        failed: []   // will hold failure details
    };

    for (const user of users) {
        const { name, email, password, role } = user;

        // Validate all required fields
        if ([name, email, password, role].some(field => !field || field.trim() === "")) {
            results.failed.push({
                user,
                reason: "Missing required fields"
            });
            continue;
        }

        // Check for existing user
        const existedUser = await User.findOne({ email });

        if (existedUser) {
            results.failed.push({
                user,
                reason: "User with this email already exists"
            });
            continue;
        }

        try {
            // Create user
            const newUser = await User.create({
                name,
                email,
                password,
                role,
                childId: "none"
            });

            const cleanUser = await User.findById(newUser._id).select("-password -refreshToken");

            results.success.push(cleanUser);
        } catch (err) {
            results.failed.push({
                user,
                reason: "Error during user creation"
            });
        }
    }

    return res.status(207).json(
        new ApiResponse(
            207,
            {
                message: "Bulk registration completed",
                successCount: results.success.length,
                failureCount: results.failed.length,
                successfulUsers: results.success,
                failedUsers: results.failed
            },
            "Processed all users"
        )
    );
});



const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const { email, password } = req.body
    console.log(email);

    if (!email) {
        throw new ApiError(400, "email is required")
    }


    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }

    const data = {
        name: loggedInUser.name,
        role: loggedInUser.role,
        childId: loggedInUser.childId
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: data, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const check = asyncHandler(async (req, res) => {
    // const user = await User.findById(req.user._id)
    // const student = await Student.findById(user?.childId);

    res.status(200).json({
        success: true,
        message: `your user id is ${req.user?.userID}`
    })
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const registerStudent = asyncHandler(async (req, res) => {

    const { userID, year, division, department, certificates, github  } = req.body

    if (
        // [userID, year, division, department, skills, certificates, github].some((field) => field?.trim() === "")
        [userID, year, division, department, certificates, github].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedStudent = await Student.findOne({ userID })

    if (existedStudent) {
        throw new ApiError(409, "student with userID already exists")
    }


    const student = await Student.create({
        id: req.user._id,
        userID: userID.toLowerCase(),
        year,
        division: division.toLowerCase(),
        department : department,
        certificates,
        github,
    })

    const createdStudent = await Student.findById(student._id)

    if (!createdStudent) {
        throw new ApiError(500, "Something went wrong while registering the student")
    }

    await User.updateOne({ _id: req.user._id }, { $set: { childId: createdStudent._id } }, { new: true }).catch((error) => {
        throw new ApiError(500, `Something went wrong while updating user - ${error.message}`)
    })

    return res.status(201).json(
        // new ApiResponse(200, createdUser, "User registered Successfully")
        new ApiResponse(200, {}, "Student registered Successfully")
    )

})
// TODO: work needs to be done for github and certificates

const registerStaff = asyncHandler(async (req, res) => {

    // const { userID, department, expertise, otherSkills  } = req.body
    const { userID, department, googleScholar } = req.body

    if (
        [userID, department, googleScholar].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedStaff = await Staff.findOne({ userID })

    if (existedStaff) {
        throw new ApiError(409, "staff with userID already exists")
    }


    const staff = await Staff.create({
        id: req.user._id,
        userID: userID.toLowerCase(),
        department : department.toLowerCase(),
        // expertise,
        // otherSkills,
    })
    // TODO: scrape scholar api for expertise

    const createdStaff = await Staff.findById(staff._id)

    if (!createdStaff) {
        throw new ApiError(500, `Something went wrong while registering the staff - ${error.message}`)
    }

    await User.updateOne({ _id: req.user._id }, { $set: { childId: createdStaff._id } }, { new: true }).catch((error) => {
        throw new ApiError(500, `Something went wrong while updating user - ${error.message}`)
    })

    return res.status(201).json(
        // new ApiResponse(200, createdUser, "User registered Successfully")
        new ApiResponse(200, {}, "Staff registered Successfully")
    )

})

const getDomains = asyncHandler(async (req, res) => {

    const domains = Object.keys(domainsWithSkills);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                domains
            },
            "Domains fetched successfully"
        )
    )
})

const getDomainsAndSkills = asyncHandler(async (req, res) => {

    res.status(200).json(
        new ApiResponse(
            200,
            {
                domainsWithSkills
            },
            "Domains with skills fetched successfully"
        )
    )
})

const getAllUsers = asyncHandler(async (req, res) => {
    try {
      // Fetch names and IDs
      const users = await User.find({})
        .select("name _id") // Include _id
        .lean();
  
      if (!users?.length) {
        return res.status(404).json(new ApiResponse(404, [], "No users found"));
      }
  
      // Create the desired response format
      const names = users.map((user) => ({
        name: user.name,
        id: user._id.toString(), // Convert ObjectId to string
      }));
  
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { names },
            "User names and IDs fetched successfully"
          )
        );
    } catch (error) {
      throw new ApiError(500, `Error fetching users: ${error.message}`);
    }
  });


export {
    registerUser,
    registerStudent,
    bulkRegisterUsers,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    check,
    registerStaff,
    getDomains,
    getDomainsAndSkills,
    getAllUsers,
}