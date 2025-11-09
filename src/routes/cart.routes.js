import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addToCart, getCart, removeItemFromCart, updateCartItemQuantity } from "../controllers/cart.controller.js";


const router = Router();



//Secured routes
router.route("/add-to-cart").post(verifyJWT,addToCart)
router.route("/get-cart").get(verifyJWT,getCart)
router.route("/remove-cart").delete(verifyJWT,removeItemFromCart)
router.route("/update-quantity").post(verifyJWT,updateCartItemQuantity)

export { router as cartRouter};