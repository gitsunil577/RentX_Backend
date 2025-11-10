import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Booking } from "../models/datamodels/booking.model.js";
import { Vehicle } from "../models/datamodels/vehicle.model.js";
import { User } from "../models/datamodels/user.model.js";
import { Owner } from "../models/datamodels/owner.model.js";
import { Payment } from "../models/datamodels/payment.model.js";
import {
  notifyCustomerBookingStatusUpdate,
  notifyBookingCancellation,
  notifyOwnerBookingCancellation
} from "../utils/notificationService.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";

// Create a new booking (All authenticated users)
const createBooking = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = req.user;

  console.log("🎫 Booking attempt by:", user.typeOfCustomer, "- User ID:", userId);

  const {
    vehicleId,
    startDate,
    endDate,
    pickupLocation,
    returnLocation,
  } = req.body;

  // Validate required fields
  if (!vehicleId || !startDate || !endDate || !pickupLocation || !returnLocation) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if vehicle exists
  const vehicle = await Vehicle.findById(vehicleId).populate("ownerID");
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // CRITICAL: Prevent owners from booking their own vehicles
  if (user.ownerID && vehicle.ownerID._id.toString() === user.ownerID.toString()) {
    console.log("❌ Owner attempting to book own vehicle - BLOCKED");
    throw new ApiError(403, "You cannot book your own vehicles. Owners can only book vehicles from other owners.");
  }

  console.log("✅ Booking allowed - User can book this vehicle");

  // Check if vehicle is available (stock > 0)
  if (vehicle.stock <= 0) {
    throw new ApiError(400, "Vehicle is not available for booking");
  }

  // Calculate number of days and total amount
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    throw new ApiError(400, "End date must be after start date");
  }

  const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Use priceINR for calculations (INR is used for all payments)
  const pricePerDay = vehicle.priceINR || vehicle.price; // Fallback to price for backward compatibility
  const totalAmount = numberOfDays * pricePerDay;

  // Create booking
  const booking = await Booking.create({
    userId,
    vehicleId,
    ownerId: vehicle.ownerID,
    startDate: start,
    endDate: end,
    pickupLocation,
    returnLocation,
    numberOfDays,
    totalAmount,
    status: "Pending",
    paymentStatus: "Pending",
  });

  // Decrease vehicle stock
  vehicle.stock -= 1;
  await vehicle.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate("vehicleId", "name image price categoryID")
    .populate("ownerId", "storeName address")
    .populate("userId", "fullname email username")
    .exec();

  return res.status(201).json(
    new ApiResponse(200, "Booking created successfully", populatedBooking)
  );
});

// Get all bookings made by the logged-in user (Both Buyers and Owners)
// Returns bookings where the user is the customer (not as vehicle owner)
const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = req.user;

  console.log("📋 Fetching bookings for user:", userId, "- Type:", user.typeOfCustomer);

  // Fetch all bookings where this user is the customer
  const bookings = await Booking.find({ userId })
    .populate("vehicleId", "name image price categoryID")
    .populate("ownerId", "storeName address")
    .sort({ createdAt: -1 })
    .exec();

  console.log(`✅ Found ${bookings.length} bookings for user`);

  return res.status(200).json(
    new ApiResponse(200, "User bookings fetched successfully", bookings)
  );
});

// Get all bookings for the logged-in owner's vehicles (Owners)
const getOwnerBookings = asyncHandler(async (req, res) => {
  const user = req.user;
  const ownerId = user.ownerID;

  // Strict check: Only Owners can view bookings for their vehicles
  if (user.typeOfCustomer !== "Owner") {
    throw new ApiError(403, "Only owners can view vehicle bookings. Customers should use user-bookings endpoint.");
  }

  if (!ownerId) {
    throw new ApiError(400, "Owner profile not completed. Please register as an owner first.");
  }

  const bookings = await Booking.find({ ownerId })
    .populate("vehicleId", "name image price categoryID")
    .populate("userId", "fullname email username")
    .sort({ createdAt: -1 })
    .exec();

  return res.status(200).json(
    new ApiResponse(200, "Owner bookings fetched successfully", bookings)
  );
});

// Get booking by ID
const getBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const user = req.user;

  if (!bookingId) {
    throw new ApiError(400, "Booking ID is required");
  }

  const booking = await Booking.findById(bookingId)
    .populate("vehicleId", "name image price categoryID")
    .populate("ownerId", "storeName address")
    .populate("userId", "fullname email username")
    .exec();

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check authorization - user must be either the booking owner or the vehicle owner
  const isBookingOwner = booking.userId._id.toString() === user._id.toString();
  const isVehicleOwner = user.ownerID && booking.ownerId._id.toString() === user.ownerID.toString();

  if (!isBookingOwner && !isVehicleOwner) {
    throw new ApiError(403, "You are not authorized to view this booking");
  }

  return res.status(200).json(
    new ApiResponse(200, "Booking fetched successfully", booking)
  );
});

// Update booking status (Owners only)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;
  const user = req.user;
  const ownerId = user.ownerID;

  // Strict check: Only Owners can update booking status
  if (user.typeOfCustomer !== "Owner") {
    throw new ApiError(403, "Only owners can update booking status");
  }

  if (!bookingId || !status) {
    throw new ApiError(400, "Booking ID and status are required");
  }

  // Validate status
  const validStatuses = ["Pending", "Confirmed", "Ongoing", "Completed", "Cancelled"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check if the logged-in owner owns the vehicle
  if (!ownerId || booking.ownerId.toString() !== ownerId.toString()) {
    throw new ApiError(403, "You are not authorized to update this booking. You can only update bookings for your own vehicles.");
  }

  // If status is being changed to Completed, increase vehicle stock
  if (status === "Completed" && booking.status !== "Completed") {
    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (vehicle) {
      vehicle.stock += 1;
      await vehicle.save();
    }
  }

  // If status is being changed to Cancelled, increase vehicle stock
  if (status === "Cancelled" && booking.status !== "Cancelled") {
    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (vehicle) {
      vehicle.stock += 1;
      await vehicle.save();
    }
  }

  // Store old status for notification
  const oldStatus = booking.status;

  booking.status = status;
  await booking.save();

  const updatedBooking = await Booking.findById(bookingId)
    .populate("vehicleId", "name image price categoryID")
    .populate("ownerId", "storeName address")
    .populate("userId", "fullname email username")
    .exec();

  // Send notification to customer about status change
  try {
    const customerUser = await User.findById(booking.userId);
    const vehicle = await Vehicle.findById(booking.vehicleId);
    const owner = await Owner.findById(booking.ownerId);

    if (customerUser && vehicle && owner && oldStatus !== status) {
      console.log(`📧 Sending status update notification to customer: ${customerUser.email}`);
      const notifications = await notifyCustomerBookingStatusUpdate({
        user: customerUser,
        booking,
        vehicle,
        owner,
        oldStatus,
        newStatus: status,
      });
      console.log(`✅ Status update notifications sent:`, notifications);
    }
  } catch (notificationError) {
    // Don't fail the booking status update if notifications fail
    console.error(`⚠️ Notification error (status update still completed):`, notificationError.message);
  }

  return res.status(200).json(
    new ApiResponse(200, "Booking status updated successfully", updatedBooking)
  );
});

// Cancel booking (Buyers and Owners)
const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const user = req.user;

  if (!bookingId) {
    throw new ApiError(400, "Booking ID is required");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check authorization - user must be either the booking owner or the vehicle owner
  const isBookingOwner = booking.userId.toString() === user._id.toString();
  const isVehicleOwner = user.ownerID && booking.ownerId.toString() === user.ownerID.toString();

  if (!isBookingOwner && !isVehicleOwner) {
    throw new ApiError(403, "You are not authorized to cancel this booking");
  }

  // Can only cancel if status is Pending or Confirmed
  if (!["Pending", "Confirmed"].includes(booking.status)) {
    throw new ApiError(400, `Cannot cancel booking with status: ${booking.status}`);
  }

  // Increase vehicle stock
  const vehicle = await Vehicle.findById(booking.vehicleId);
  if (vehicle) {
    vehicle.stock += 1;
    await vehicle.save();
  }

  booking.status = "Cancelled";
  await booking.save();

  const updatedBooking = await Booking.findById(bookingId)
    .populate("vehicleId", "name image price categoryID")
    .populate("ownerId", "storeName address")
    .populate("userId", "fullname email username")
    .exec();

  // Send notifications to both customer and owner
  try {
    const customerUser = await User.findById(booking.userId);
    const owner = await Owner.findById(booking.ownerId);
    const ownerUser = await User.findOne({ ownerID: owner._id });

    // Determine who cancelled the booking
    const cancelledBy = isBookingOwner ? 'customer' : 'owner';

    console.log(`📧 Booking cancelled by: ${cancelledBy}`);
    console.log(`   └─ Sending notifications to BOTH customer and owner...`);

    // ALWAYS notify customer about cancellation (whether they cancelled or owner cancelled)
    if (customerUser && vehicle && owner) {
      console.log(`📧 Sending cancellation notification to customer: ${customerUser.email}`);
      const customerNotifications = await notifyBookingCancellation({
        user: customerUser,
        booking,
        vehicle,
        owner,
        cancelledBy,
      });
      console.log(`✅ Customer cancellation notifications sent:`, customerNotifications);
    }

    // ALWAYS notify owner about cancellation (whether customer cancelled or owner cancelled)
    if (owner && ownerUser && customerUser && vehicle) {
      console.log(`📧 Sending cancellation notification to owner: ${owner.storeName}`);
      const ownerNotifications = await notifyOwnerBookingCancellation({
        owner,
        ownerUser,
        customerUser,
        booking,
        vehicle,
        cancelledBy, // Pass who cancelled so owner knows
      });
      console.log(`✅ Owner cancellation notifications sent:`, ownerNotifications);
    }
  } catch (notificationError) {
    // Don't fail the cancellation if notifications fail
    console.error(`⚠️ Notification error (cancellation still completed):`, notificationError.message);
  }

  return res.status(200).json(
    new ApiResponse(200, "Booking cancelled successfully", updatedBooking)
  );
});

// Download invoice for a booking
const downloadInvoice = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const user = req.user;

  if (!bookingId) {
    throw new ApiError(400, "Booking ID is required");
  }

  // Fetch booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check authorization - user must be either the booking owner or the vehicle owner
  const isBookingOwner = booking.userId.toString() === user._id.toString();
  const isVehicleOwner = user.ownerID && booking.ownerId.toString() === user.ownerID.toString();

  if (!isBookingOwner && !isVehicleOwner) {
    throw new ApiError(403, "You are not authorized to download this invoice");
  }

  // Check if booking has been paid
  if (booking.paymentStatus !== "Paid") {
    throw new ApiError(400, "Invoice not available. Booking payment is not completed.");
  }

  try {
    console.log(`📄 Generating invoice for download: ${bookingId}`);

    // Fetch related data
    const vehicle = await Vehicle.findById(booking.vehicleId);
    const customer = await User.findById(booking.userId);
    const owner = await Owner.findById(booking.ownerId);
    const payment = await Payment.findOne({ bookingId: booking._id });

    if (!vehicle || !customer || !owner) {
      throw new ApiError(500, "Missing required data for invoice generation");
    }

    // Generate invoice number if not already generated
    if (!booking.invoiceNumber) {
      const timestamp = Date.now().toString().slice(-6);
      const bookingShort = booking._id.toString().slice(-4).toUpperCase();
      booking.invoiceNumber = `RENTX-INV-${timestamp}-${bookingShort}`;
      booking.invoiceGenerated = true;
      booking.invoiceGeneratedAt = new Date();
      await booking.save();
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      booking,
      vehicle,
      customer,
      owner,
      payment
    });

    // Set response headers for PDF download
    const filename = `${booking.invoiceNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log(`✅ Invoice downloaded: ${filename}`);

    // Send PDF buffer
    return res.send(pdfBuffer);

  } catch (error) {
    console.error(`❌ Invoice generation error:`, error);
    throw new ApiError(500, `Failed to generate invoice: ${error.message}`);
  }
});

export {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  downloadInvoice,
};
