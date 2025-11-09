import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js';
import { registerVehicle , vehicleDetails, allVehicles, vehicleByID} from "../controllers/vehicle.controller.js";

const router=Router();

router.route("/vehicle-details").post(vehicleDetails)
router.route("/all-vehicles").get(allVehicles)
router.route("/vehicleByID/:id").get(vehicleByID);


//Secured Routes
router.route("/register-vehicle").post(verifyJWT,upload.fields([
    {
        name:"image",
        maxCount: 5
    }
]),registerVehicle)



export { router as vehicleRouter };
