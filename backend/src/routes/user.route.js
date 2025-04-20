import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    registerStudent,
    bulkRegisterUsers,
    // refreshAccessToken, 
    changeCurrentPassword, 
    check,
    registerStaff,
    getDomains,
    getDomainsAndSkills,
    getAllUsers

} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshTokenMiddleware } from "../middlewares/refreshToken.middleware.js";

const router = Router()
router.route('/').get(
    getAllUsers)

router.route("/register").post(
    registerUser)

router.route("/bulkRegister").post(
    bulkRegisterUsers)

router.route("/login").post(loginUser)

router.route("/check").get(verifyJWT, refreshTokenMiddleware, check)

router.route("/logout").get(verifyJWT, refreshTokenMiddleware, 
    logoutUser)

// router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, refreshTokenMiddleware, 
    changeCurrentPassword)

router.route("/register-student").post(verifyJWT, refreshTokenMiddleware, 
    registerStudent)

router.route("/register-staff").post(verifyJWT, refreshTokenMiddleware, 
    registerStaff)
    
router.route("/getDomains").get(verifyJWT, refreshTokenMiddleware, 
    getDomains)

router.route("/getDomainsAndSkills").get(verifyJWT, refreshTokenMiddleware, 
    getDomainsAndSkills)


export default router