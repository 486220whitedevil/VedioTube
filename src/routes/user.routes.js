import { Router } from "express";

import { registerUser } from "../constrollers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

// POST /api/users/register
 router.route("/register").post(registerUser);


export default router;