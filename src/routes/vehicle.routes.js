import { Router } from "express";
import { verifyJWT, isOwner } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js';
import {
  registerVehicle,
  vehicleDetails,
  allVehicles,
  vehicleByID,
  deleteVehicle,
  getOwnerVehicles,
  updateVehicle
} from "../controllers/vehicle.controller.js";

const router = Router();

// Public Routes - Anyone can view vehicles
router.route("/vehicle-details").post(vehicleDetails);
router.route("/all-vehicles").get(allVehicles);
router.route("/vehicleByID/:id").get(vehicleByID);

// Owner-Only Routes - Require authentication and owner role
router.route("/register-vehicle").post(
  verifyJWT,
  isOwner,
  upload.fields([{ name: "image", maxCount: 5 }]),
  registerVehicle
);

router.route("/owner-vehicles").get(verifyJWT, isOwner, getOwnerVehicles);

router.route("/update-vehicle/:vehicleId").put(
  verifyJWT,
  isOwner,
  upload.fields([{ name: "image", maxCount: 5 }]),
  updateVehicle
);

router.route("/delete-vehicle/:vehicleId").delete(verifyJWT, isOwner, deleteVehicle);

export { router as vehicleRouter };
