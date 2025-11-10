import razorpayInstance from '../utils/razorpayInstance.js';
import crypto from 'crypto';
import { convertPaiseToRupees, formatINR } from '../utils/currencyConverter.js';
import { Booking } from '../models/datamodels/booking.model.js';
import { Vehicle } from '../models/datamodels/vehicle.model.js';
import { Payment } from '../models/datamodels/payment.model.js';
import { User } from '../models/datamodels/user.model.js';
import { Owner } from '../models/datamodels/owner.model.js';
import { notifyOwnerNewBooking, notifyCustomerBookingConfirmed } from '../utils/notificationService.js';
import { generateInvoicePDF } from '../utils/invoiceGenerator.js';

const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    console.log("📥 Incoming order request. Amount (in paise):", amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error("❌ Invalid amount received:", amount);
      return res.status(400).json({ success: false, message: "Invalid amount received" });
    }

    // Check if Razorpay is properly configured
    if (!razorpayInstance) {
      console.error("❌ Razorpay instance is not initialized");
      return res.status(500).json({ success: false, message: "Payment service not available" });
    }

    // IMPORTANT: Razorpay requires amounts in PAISE (smallest currency unit)
    // - 1 Rupee (₹) = 100 Paise
    // - Frontend should send: totalAmount × 100
    // - Example: ₹2,098.57 → 209,857 paise
    //
    // Currency Flow:
    // 1. Owner enters price in USD → Backend converts to INR
    // 2. Booking calculates total in INR
    // 3. Frontend multiplies INR by 100 → sends paise to backend
    // 4. Backend creates Razorpay order in paise

    const amountInRupees = convertPaiseToRupees(amount);

    console.log("💰 Payment Details:");
    console.log(`   └─ Amount in Paise: ${amount} paise`);
    console.log(`   └─ Amount in Rupees: ${formatINR(amountInRupees)}`);
    console.log(`   └─ Conversion: ${amount} ÷ 100 = ₹${amountInRupees}`);

    const options = {
      amount: amount, // Amount in paise (required by Razorpay)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    console.log("✅ Order created successfully:");
    console.log(`   └─ Order ID: ${order.id}`);
    console.log(`   └─ Amount: ${formatINR(amountInRupees)} (${amount} paise)`);

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("🔥 Razorpay order creation failed:");
    console.error("↳ Message:", error?.message);
    console.error("↳ Stack:", error?.stack);
    return res.status(500).json({ success: false, message: "Order creation failed" });
  }
};

const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems, rentalDetails } = req.body;

  try {
    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Payment verification failed - Invalid signature");
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    console.log("✅ Payment verified successfully");

    // Get user ID from authenticated request
    const userId = req.user?._id;
    if (!userId) {
      console.error("❌ User not authenticated");
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    console.log("📦 Creating bookings for user:", userId);

    // Create bookings for each cart item
    const createdBookings = [];
    const bookingErrors = [];

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.error("❌ No cart items provided");
      return res.status(400).json({ success: false, message: 'No cart items to process' });
    }

    for (const item of cartItems) {
      try {
        // Get vehicle details
        const vehicle = await Vehicle.findById(item.vehicleId).populate("ownerID");
        if (!vehicle) {
          console.error(`❌ Vehicle not found: ${item.vehicleId}`);
          bookingErrors.push({ vehicleId: item.vehicleId, error: 'Vehicle not found' });
          continue;
        }

        // Get rental details for this vehicle
        const rental = rentalDetails?.find(r => r.vehicleId === item.vehicleId);
        if (!rental) {
          console.error(`❌ Rental details not found for vehicle: ${item.vehicleId}`);
          bookingErrors.push({ vehicleId: item.vehicleId, error: 'Rental details not found' });
          continue;
        }

        // Calculate dates and amount
        const startDate = new Date(rental.startDate);
        const endDate = new Date(rental.endDate);
        const numberOfDays = rental.rentalDays || Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        // Create booking
        const booking = await Booking.create({
          userId,
          vehicleId: item.vehicleId,
          ownerId: vehicle.ownerID._id,
          startDate,
          endDate,
          pickupLocation: rental.pickupLocation || 'Not specified',
          returnLocation: rental.returnLocation || rental.pickupLocation || 'Not specified',
          numberOfDays,
          totalAmount: rental.totalPrice,
          status: "Confirmed",
          paymentStatus: "Paid",
        });

        console.log(`✅ Booking created: ${booking._id} for vehicle: ${vehicle.name}`);
        createdBookings.push(booking);

        // Decrease vehicle stock (if not already done)
        if (vehicle.stock > 0) {
          vehicle.stock -= item.quantity || 1;
          await vehicle.save();
          console.log(`📉 Vehicle stock decreased: ${vehicle.name} - New stock: ${vehicle.stock}`);
        }

        // Create payment record
        const paymentRecord = await Payment.create({
          bookingId: booking._id,
          userId,
          paymentMethod: "UPI", // Razorpay supports multiple methods
          paymentStatus: "Success",
          amount: rental.totalPrice,
          transactionId: razorpay_payment_id,
        });

        // Generate invoice and update booking
        let invoicePDF = null;
        try {
          console.log(`📄 Generating invoice for booking: ${booking._id}`);

          // Generate invoice number
          const timestamp = Date.now().toString().slice(-6);
          const bookingShort = booking._id.toString().slice(-4).toUpperCase();
          const invoiceNumber = `RENTX-INV-${timestamp}-${bookingShort}`;

          // Generate invoice PDF
          const owner = await Owner.findById(vehicle.ownerID._id);
          const customerUser = await User.findById(userId);

          invoicePDF = await generateInvoicePDF({
            booking,
            vehicle,
            customer: customerUser,
            owner,
            payment: paymentRecord
          });

          // Update booking with invoice information
          booking.invoiceNumber = invoiceNumber;
          booking.invoiceGenerated = true;
          booking.invoiceGeneratedAt = new Date();
          await booking.save();

          console.log(`✅ Invoice generated: ${invoiceNumber}`);
        } catch (invoiceError) {
          console.error(`⚠️ Invoice generation error (continuing with notifications):`, invoiceError.message);
        }

        // Send notifications to owner and customer
        try {
          // Get owner details with user info
          const owner = await Owner.findById(vehicle.ownerID._id);
          const ownerUser = await User.findOne({ ownerID: owner._id });
          const customerUser = await User.findById(userId);

          // Reload booking to ensure invoice fields are available
          const updatedBooking = await Booking.findById(booking._id);

          // Notify owner about new booking
          if (owner && ownerUser && customerUser) {
            console.log(`📧 Sending notification to owner: ${owner.storeName}`);
            const ownerNotifications = await notifyOwnerNewBooking({
              owner,
              ownerUser, // Owner's user account for email
              customerUser, // Customer info to show in owner's notification
              booking: updatedBooking,
              vehicle,
            });
            console.log(`✅ Owner notifications sent:`, ownerNotifications);
          }

          // Notify customer about booking confirmation with invoice
          if (customerUser) {
            console.log(`📧 Sending confirmation to customer: ${customerUser.email}`);
            console.log(`   └─ Invoice PDF buffer size: ${invoicePDF ? invoicePDF.length + ' bytes' : 'Not generated'}`);
            console.log(`   └─ Invoice number: ${updatedBooking.invoiceNumber || 'Not set'}`);

            const customerNotifications = await notifyCustomerBookingConfirmed({
              user: customerUser,
              booking: updatedBooking,
              vehicle,
              owner,
              payment: paymentRecord,
              invoicePDF, // Attach invoice PDF to email
            });
            console.log(`✅ Customer notifications sent:`, customerNotifications);
          }
        } catch (notificationError) {
          // Don't fail the booking if notifications fail
          console.error(`⚠️ Notification error (booking still created):`, notificationError.message);
          console.error(`   └─ Stack trace:`, notificationError.stack);
        }

      } catch (bookingError) {
        console.error(`❌ Error creating booking for vehicle ${item.vehicleId}:`, bookingError);
        bookingErrors.push({ vehicleId: item.vehicleId, error: bookingError.message });
      }
    }

    console.log(`📊 Booking Summary:`);
    console.log(`   └─ Total items: ${cartItems.length}`);
    console.log(`   └─ Successful: ${createdBookings.length}`);
    console.log(`   └─ Failed: ${bookingErrors.length}`);

    if (createdBookings.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Payment verified but failed to create bookings',
        errors: bookingErrors
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and bookings created successfully',
      bookings: createdBookings,
      errors: bookingErrors.length > 0 ? bookingErrors : undefined
    });

  } catch (error) {
    console.error("🔥 Payment verification error:", error);
    return res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};

export { createOrder, verifyPayment };
