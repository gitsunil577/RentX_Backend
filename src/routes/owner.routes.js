import { Router } from "express";
import { registerOwner, ownerDetails } from "../controllers/owner.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

//secured routes
router.route("/register-owner").post(verifyJWT,registerOwner)
router.route("/owner-details").get(verifyJWT,ownerDetails)

export { router as ownerRouter };
