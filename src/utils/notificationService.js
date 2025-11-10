// Notification Service for SMS and Email
// Supports multiple providers: Twilio (SMS), NodeMailer (Email)

import nodemailer from 'nodemailer';

// Email Configuration using Gmail (you can change to other providers)
const createEmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("⚠️ Email credentials not configured. Email notifications disabled.");
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail', // You can use 'outlook', 'yahoo', or custom SMTP
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use app-specific password for Gmail
    },
  });
};

// SMS Configuration (Twilio)
// To use Twilio SMS:
// 1. Install: npm install twilio
// 2. Add to .env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
// 3. Uncomment the code below


import twilio from 'twilio';

const createSMSClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn("⚠️ Twilio credentials not configured. SMS notifications disabled.");
    return null;
  }

  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};


/**
 * Send Email Notification
 */
export const sendEmailNotification = async ({ to, subject, html, text }) => {
  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      console.log("📧 Email notification skipped (not configured)");
      return { success: false, message: "Email not configured" };
    }

    const mailOptions = {
      from: `"RentX" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send SMS Notification (Twilio)
 * Uncomment when Twilio is configured
 */
export const sendSMSNotification = async ({ to, message }) => {
  try {
    // Uncomment when Twilio is set up
    
    const client = createSMSClient();
    if (!client) {
      console.log("📱 SMS notification skipped (not configured)");
      return { success: false, message: "SMS not configured" };
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log("✅ SMS sent successfully:", result.sid);
    return { success: true, sid: result.sid };
    

  } catch (error) {
    console.error("❌ SMS send error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Notify owner about new booking
 * @param {Object} owner - Owner document
 * @param {Object} ownerUser - Owner's user account
 * @param {Object} customerUser - Customer who made the booking
 * @param {Object} booking - Booking document
 * @param {Object} vehicle - Vehicle document
 */
export const notifyOwnerNewBooking = async ({ owner, ownerUser, customerUser, booking, vehicle }) => {
  const notifications = [];

  // Get owner's contact info
  const ownerEmail = ownerUser?.email; // Owner's user account email
  const ownerPhone = owner.phoneNumber;

  // Format dates
  const startDate = new Date(booking.startDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const endDate = new Date(booking.endDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Email Notification
  if (owner.notificationPreferences?.email !== false && ownerEmail) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Booking Alert!</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${owner.storeName},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! You have received a new booking for your vehicle.
          </p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">📋 Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Booking ID:</strong></td>
                <td style="padding: 8px 0; color: #333;">#${booking._id.toString().slice(-8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Vehicle:</strong></td>
                <td style="padding: 8px 0; color: #333;">${vehicle.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Customer:</strong></td>
                <td style="padding: 8px 0; color: #333;">${customerUser.fullname || customerUser.username}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Customer Email:</strong></td>
                <td style="padding: 8px 0; color: #333;">${customerUser.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Rental Period:</strong></td>
                <td style="padding: 8px 0; color: #333;">${startDate} - ${endDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Duration:</strong></td>
                <td style="padding: 8px 0; color: #333;">${booking.numberOfDays} days</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Total Amount:</strong></td>
                <td style="padding: 8px 0; color: #22c55e; font-size: 18px; font-weight: bold;">₹${booking.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Pickup Location:</strong></td>
                <td style="padding: 8px 0; color: #333;">${booking.pickupLocation}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Status:</strong></td>
                <td style="padding: 8px 0;">
                  <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 4px; font-weight: 600;">
                    ${booking.status}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Payment:</strong></td>
                <td style="padding: 8px 0;">
                  <span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 4px; font-weight: 600;">
                    ${booking.paymentStatus}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⏰ Action Required:</strong> Please log in to your RentX dashboard to confirm this booking.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner-bookings"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              View Booking Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
            This is an automated notification from RentX.<br>
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmailNotification({
      to: ownerEmail,
      subject: `🎉 New Booking for ${vehicle.name} - RentX`,
      html: emailHtml,
    });

    notifications.push({ type: 'email', ...emailResult });
  }

  // SMS Notification
  if (owner.notificationPreferences?.sms !== false && ownerPhone) {
    const smsMessage = `RentX Alert: New booking for ${vehicle.name}! Customer: ${customerUser.fullname || customerUser.username}, Duration: ${booking.numberOfDays} days, Amount: ₹${booking.totalAmount}. Login to confirm: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner-bookings`;

    const smsResult = await sendSMSNotification({
      to: ownerPhone,
      message: smsMessage,
    });

    notifications.push({ type: 'sms', ...smsResult });
  }

  return notifications;
};

/**
 * Notify customer about booking confirmation
 */
export const notifyCustomerBookingConfirmed = async ({ user, booking, vehicle, owner }) => {
  const notifications = [];

  const startDate = new Date(booking.startDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const endDate = new Date(booking.endDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Email to customer
  if (user.email) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${user.fullname || user.username},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! Your booking has been confirmed and payment has been processed successfully.
          </p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #10b981; margin-top: 0;">🚗 Your Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Booking ID:</strong></td>
                <td style="padding: 8px 0; color: #333;">#${booking._id.toString().slice(-8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Vehicle:</strong></td>
                <td style="padding: 8px 0; color: #333;">${vehicle.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Rental Period:</strong></td>
                <td style="padding: 8px 0; color: #333;">${startDate} - ${endDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Duration:</strong></td>
                <td style="padding: 8px 0; color: #333;">${booking.numberOfDays} days</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Total Paid:</strong></td>
                <td style="padding: 8px 0; color: #10b981; font-size: 18px; font-weight: bold;">₹${booking.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Pickup Location:</strong></td>
                <td style="padding: 8px 0; color: #333;">${booking.pickupLocation}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Owner:</strong></td>
                <td style="padding: 8px 0; color: #333;">${owner.storeName}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings"
               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              View My Bookings
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
            Thank you for choosing RentX! Have a great experience.<br>
            For support, contact us at support@rentx.com
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmailNotification({
      to: user.email,
      subject: `✅ Booking Confirmed - ${vehicle.name} - RentX`,
      html: emailHtml,
    });

    notifications.push({ type: 'email', ...emailResult });
  }

  return notifications;
};

export default {
  sendEmailNotification,
  sendSMSNotification,
  notifyOwnerNewBooking,
  notifyCustomerBookingConfirmed,
};
