// src/routes/payment.routes.js
import express from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.post('/create-order', verifyJWT, createOrder);
router.post('/verify-payment', verifyJWT, verifyPayment);

export {router as paymentRouter};
