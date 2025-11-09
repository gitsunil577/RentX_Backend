import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js';
import { registerProduct , productDetails, allProducts, productByID} from "../controllers/product.controller.js";

const router=Router();

router.route("/product-details").post(productDetails)
router.route("/all-products").get(allProducts)
router.route("/productByID/:id").get(productByID);


//Secured Routes
router.route("/register-product").post(verifyJWT,upload.fields([
    {
        name:"image",
        maxCount: 5
    }
]),registerProduct)



export { router as productRouter };