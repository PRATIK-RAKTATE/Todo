import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshTokenMiddleware } from "../middlewares/refreshToken.middleware.js";

import { sendAccountInvitations } from '../controllers/email.controller.js'

const router = Router()

router.post('/send-invitations', sendAccountInvitations);


export default router

