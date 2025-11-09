import { Router } from "express";
import { getAllCategories, getCategoryById } from "../controllers/category.controller.js";

const router = Router();

// Public routes - no authentication required
router.route("/all-categories").get(getAllCategories);
router.route("/:id").get(getCategoryById);

export { router as categoryRouter };
