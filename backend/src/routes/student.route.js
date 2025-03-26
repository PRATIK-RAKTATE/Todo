import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshTokenMiddleware } from "../middlewares/refreshToken.middleware.js";
// import { findStudent } from "../middlewares/findStudent.middleware.js";
import { check, 
    reset, 
    submitSkills, 
    submitAbstracts,
    studentDashboard,
    getSubmittedAbstract,
    getApprovedAbstract,
    finalizeAbstract,
    getProjectAndStudentData,
    sendInvitations,
    getInvitesAndRequests
 } from "../controllers/student.controller.js";

const router = Router()


router.route("/check").get(verifyJWT, refreshTokenMiddleware, check)
router.route("/reset").get(verifyJWT, refreshTokenMiddleware, reset)
router.route("/submitSkills").post(verifyJWT, refreshTokenMiddleware, submitSkills)
router.route("/submitAbstracts").post(verifyJWT, refreshTokenMiddleware, submitAbstracts)
router.route("/studentDashboard").get(verifyJWT, refreshTokenMiddleware, studentDashboard)
router.route("/getSubmittedAbstract").get(verifyJWT, refreshTokenMiddleware, getSubmittedAbstract)
router.route("/getApprovedAbstract").get(verifyJWT, refreshTokenMiddleware, getApprovedAbstract)
router.route("/finalizeAbstract").post(verifyJWT, refreshTokenMiddleware, finalizeAbstract)
router.route("/getProjectAndStudentData").get(verifyJWT, refreshTokenMiddleware, getProjectAndStudentData)
router.route("/sendInvitations").post(verifyJWT, refreshTokenMiddleware, sendInvitations)
router.route("/getInvitesAndRequests").get(verifyJWT, refreshTokenMiddleware, getInvitesAndRequests)


// router.route("/login").post(loginUser)

//secured routes
// router.route("/logout").post(verifyJWT,  logoutUser)
// router.route("/refresh-token").post(refreshAccessToken)
// router.route("/change-password").post(verifyJWT, changeCurrentPassword)
// router.route("/current-user").get(verifyJWT, getCurrentUser)
// router.route("/update-account").patch(verifyJWT, updateAccountDetails)

// router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
// router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

// router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
// router.route("/history").get(verifyJWT, getWatchHistory)

export default router