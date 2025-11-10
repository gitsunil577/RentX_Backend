import { Router } from "express";
import { verifyJWT, isOwner, isBuyer } from "../middlewares/auth.middleware.js";
import {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
} from "../controllers/booking.controller.js";

const router = Router();

// Booking Routes - All authenticated users can create bookings and view their bookings
// (Controller prevents owners from booking their own vehicles)
router.route("/create-booking").post(verifyJWT, createBooking);
router.route("/user-bookings").get(verifyJWT, getUserBookings);

// Owner-Specific Routes - Only authenticated owners can view bookings for their vehicles
router.route("/owner-bookings").get(verifyJWT, isOwner, getOwnerBookings);
router.route("/update-status/:bookingId").put(verifyJWT, isOwner, updateBookingStatus);

// Shared Routes - Both buyers and owners can access (with proper authorization check in controller)
router.route("/booking/:bookingId").get(verifyJWT, getBookingById);
router.route("/cancel-booking/:bookingId").put(verifyJWT, cancelBooking);

export { router as bookingRouter };
