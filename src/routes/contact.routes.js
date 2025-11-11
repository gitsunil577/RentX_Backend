import { Router } from 'express';
import { submitContactForm } from '../controllers/contact.controller.js';

const router = Router();

// Public route - anyone can submit contact form
router.route('/submit').post(submitContactForm);

export { router as contactRouter };
