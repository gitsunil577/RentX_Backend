// src/routes/payment.routes.js
import express from 'express';
import { createOrder,verifyPayment } from '../controllers/payment.controller.js';
const router = express.Router();

router.post('/create-order', createOrder);
router.post('/verify-payment',verifyPayment);

export {router as paymentRouter};
