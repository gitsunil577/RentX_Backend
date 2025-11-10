import { Router } from "express";
import { registerOwner, ownerDetails, updateOwnerProfile } from "../controllers/owner.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

//secured routes
router.route("/register-owner").post(verifyJWT,registerOwner)
router.route("/owner-details").get(verifyJWT,ownerDetails)
router.route("/update-owner-profile").put(verifyJWT,updateOwnerProfile)

export { router as ownerRouter };
