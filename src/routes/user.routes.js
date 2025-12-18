import { Router } from "express";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";

import { loginUser, logoutUser, registerUser ,refreshAccessToken} from "../constrollers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

// POST /api/users/register
 router.route("/register").post(
    upload.fields([
        {
            name: "profileImage",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyAccessToken, logoutUser)
router.route("/refresh-access-token").post(refreshAccessToken)
router.route("/change-password").post(verifyAccessToken, changePassword)



export default router;