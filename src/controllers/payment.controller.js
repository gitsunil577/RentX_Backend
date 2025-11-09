import razorpayInstance from '../utils/razorpayInstance.js';
import crypto from 'crypto';

const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    console.log("📥 Incoming order request. Amount:", amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error("❌ Invalid amount received:", amount);
      return res.status(400).json({ success: false, message: "Invalid amount received" });
    }

    // Check if Razorpay is properly configured
    if (!razorpayInstance) {
      console.error("❌ Razorpay instance is not initialized");
      return res.status(500).json({ success: false, message: "Payment service not available" });
    }

    const options = {
      amount: amount, // already in paise from frontend
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    console.log("✅ Order created:", order);

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("🔥 Razorpay order creation failed:");
    console.error("↳ Message:", error?.message);
    console.error("↳ Stack:", error?.stack);
    return res.status(500).json({ success: false, message: "Order creation failed" });
  }
};

const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature === razorpay_signature) {
    return res.status(200).json({ success: true, message: 'Payment verified' });
  } else {
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }
};

export { createOrder, verifyPayment };
