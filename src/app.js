import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { paymentRouter } from './routes/payment.routes.js';
import { userRouter } from './routes/user.routes.js';
import { ownerRouter } from './routes/owner.routes.js';
import { vehicleRouter } from './routes/vehicle.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { bookingRouter } from './routes/booking.routes.js';
import { contactRouter } from './routes/contact.routes.js';

const app = express();

// ---------- MIDDLEWARE ----------
app.use(cookieParser());
// ✅ CORS CONFIG (critical for cookies)
const allowedOrigins = process.env.ORIGIN_URL
  ? process.env.ORIGIN_URL.split(',')
  :['https://rent-x-frontend.vercel.app/'];
  //: ['http://localhost:5173']; // frontend React default port
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(express.static('public'));


// ---------- ROUTES ----------
app.use('/api/v1/user', userRouter);
app.use('/api/v1/owner', ownerRouter);
app.use('/api/v1/vehicle', vehicleRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/category', categoryRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/booking', bookingRouter);
app.use('/api/v1/contact', contactRouter);

export { app };
 
