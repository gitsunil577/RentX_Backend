import { Router } from "express";
import { registerSeller, sellerDetails } from "../controllers/seller.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

//secured routes
router.route("/register-seller").post(verifyJWT,registerSeller)
router.route("/seller-details").get(verifyJWT,sellerDetails)

export { router as sellerRouter };