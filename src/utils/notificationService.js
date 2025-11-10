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
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.html - HTML content
 * @param {String} options.text - Plain text content
 * @param {Array} options.attachments - Email attachments [{filename, content, contentType}]
 */
export const sendEmailNotification = async ({ to, subject, html, text, attachments }) => {
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

    // Add attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      mailOptions.attachments = attachments;
      console.log(`📎 Email includes ${attachments.length} attachment(s)`);
    }

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
 */
export const sendSMSNotification = async ({ to, message }) => {
  try {
    console.log("📱 Attempting to send SMS...");
    console.log("   └─ To:", to);
    console.log("   └─ From:", process.env.TWILIO_PHONE_NUMBER);
    console.log("   └─ Message:", message.substring(0, 50) + "...");

    const client = createSMSClient();
    if (!client) {
      console.log("❌ SMS notification skipped - Twilio not configured");
      console.log("   └─ TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? "SET" : "MISSING");
      console.log("   └─ TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "SET" : "MISSING");
      return { success: false, message: "SMS not configured" };
    }

    // Validate phone number format
    if (!to) {
      console.log("❌ SMS not sent - recipient phone number is empty");
      return { success: false, error: "No phone number provided" };
    }

    if (!to.startsWith('+')) {
      console.log("⚠️ Warning: Phone number doesn't start with + (should be in international format)");
    }

    console.log("🚀 Sending SMS via Twilio...");
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log("✅ SMS sent successfully!");
    console.log("   └─ Message SID:", result.sid);
    console.log("   └─ Status:", result.status);
    return { success: true, sid: result.sid };

  } catch (error) {
    console.error("❌ SMS send error:");
    console.error("   └─ Error Message:", error.message);
    console.error("   └─ Error Code:", error.code);
    console.error("   └─ Error Details:", error.moreInfo);
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
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner-dashboard"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              View Dashboard
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
  console.log("🔔 Checking if SMS should be sent to owner...");
  console.log("   └─ Owner phone number:", ownerPhone || "NOT SET");
  console.log("   └─ SMS preference:", owner.notificationPreferences?.sms !== false ? "ENABLED" : "DISABLED");

  if (owner.notificationPreferences?.sms !== false && ownerPhone) {
    console.log("✅ Sending SMS to owner...");
    const smsMessage = `RentX Alert: New booking for ${vehicle.name}! Customer: ${customerUser.fullname || customerUser.username}, Duration: ${booking.numberOfDays} days, Amount: ₹${booking.totalAmount}. Login to dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner-dashboard`;

    const smsResult = await sendSMSNotification({
      to: ownerPhone,
      message: smsMessage,
    });

    notifications.push({ type: 'sms', ...smsResult });
  } else {
    console.log("⚠️ SMS not sent to owner:");
    if (!ownerPhone) console.log("   └─ Reason: No phone number set");
    if (owner.notificationPreferences?.sms === false) console.log("   └─ Reason: SMS disabled in preferences");
  }

  return notifications;
};

/**
 * Notify customer about booking confirmation
 * @param {Object} options - Notification options
 * @param {Object} options.user - Customer user object
 * @param {Object} options.booking - Booking details
 * @param {Object} options.vehicle - Vehicle details
 * @param {Object} options.owner - Owner details
 * @param {Object} options.payment - Payment details (optional)
 * @param {Buffer} options.invoicePDF - Invoice PDF buffer (optional)
 */
export const notifyCustomerBookingConfirmed = async ({ user, booking, vehicle, owner, payment, invoicePDF }) => {
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

          ${invoicePDF ? `
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1e40af; font-size: 14px; margin: 0;">
              📄 <strong>Invoice Attached</strong> - Your verified invoice from RentX is attached to this email.
            </p>
          </div>
          ` : ''}

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #10b981; margin-top: 0;">🚗 Your Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Booking ID:</strong></td>
                <td style="padding: 8px 0; color: #333;">#${booking._id.toString().slice(-8).toUpperCase()}</td>
              </tr>
              ${booking.invoiceNumber ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Invoice Number:</strong></td>
                <td style="padding: 8px 0; color: #333;">${booking.invoiceNumber}</td>
              </tr>
              ` : ''}
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

    // Prepare email options
    const emailOptions = {
      to: user.email,
      subject: `✅ Booking Confirmed - ${vehicle.name} - RentX`,
      html: emailHtml,
    };

    // Add invoice attachment if provided
    if (invoicePDF) {
      const invoiceFilename = booking.invoiceNumber
        ? `${booking.invoiceNumber}.pdf`
        : `Invoice_${booking._id.toString().slice(-8)}.pdf`;

      emailOptions.attachments = [{
        filename: invoiceFilename,
        content: invoicePDF,
        contentType: 'application/pdf'
      }];

      console.log(`📎 Attaching invoice: ${invoiceFilename}`);
    }

    const emailResult = await sendEmailNotification(emailOptions);
    notifications.push({ type: 'email', ...emailResult });
  }

  // SMS to customer
  console.log("🔔 Checking if SMS should be sent to customer...");
  console.log("   └─ Customer phone number:", user.phoneNumber || "NOT SET");

  if (user.phoneNumber) {
    console.log("✅ Sending SMS to customer...");
    const smsMessage = `RentX: Booking Confirmed! ${vehicle.name} from ${startDate} to ${endDate}. Total: ₹${booking.totalAmount}. Pickup: ${booking.pickupLocation}. Owner: ${owner.storeName}. Booking ID: #${booking._id.toString().slice(-8).toUpperCase()}. Invoice sent via email.`;

    const smsResult = await sendSMSNotification({
      to: user.phoneNumber,
      message: smsMessage,
    });

    notifications.push({ type: 'sms', ...smsResult });
  } else {
    console.log("⚠️ SMS not sent to customer:");
    console.log("   └─ Reason: No phone number set");
  }

  return notifications;
};

/**
 * Notify customer about booking status update
 */
export const notifyCustomerBookingStatusUpdate = async ({ user, booking, vehicle, owner, oldStatus, newStatus }) => {
  const notifications = [];

  const startDate = new Date(booking.startDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Determine status color and message
  let statusColor = '#3b82f6';
  let statusMessage = 'Your booking status has been updated';

  if (newStatus === 'Confirmed') {
    statusColor = '#10b981';
    statusMessage = 'Your booking has been confirmed by the owner';
  } else if (newStatus === 'Ongoing') {
    statusColor = '#f59e0b';
    statusMessage = 'Your rental period has started';
  } else if (newStatus === 'Completed') {
    statusColor = '#6366f1';
    statusMessage = 'Your booking has been completed. Thank you!';
  } else if (newStatus === 'Cancelled') {
    statusColor = '#ef4444';
    statusMessage = 'Your booking has been cancelled';
  }

  // Email to customer
  if (user.email) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: ${statusColor}; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Booking Status Update</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${user.fullname || user.username},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${statusMessage}
          </p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: ${statusColor}; margin-top: 0;">Booking Details</h3>
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
                <td style="padding: 8px 0; color: #666;"><strong>Start Date:</strong></td>
                <td style="padding: 8px 0; color: #333;">${startDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Previous Status:</strong></td>
                <td style="padding: 8px 0; color: #999;">${oldStatus}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>New Status:</strong></td>
                <td style="padding: 8px 0;">
                  <span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 4px; font-weight: 600;">
                    ${newStatus}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings"
               style="background: ${statusColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              View My Bookings
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
            This is an automated notification from RentX.<br>
            For support, contact us at support@rentx.com
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmailNotification({
      to: user.email,
      subject: `Booking Status Update: ${newStatus} - ${vehicle.name} - RentX`,
      html: emailHtml,
    });

    notifications.push({ type: 'email', ...emailResult });
  }

  // SMS to customer
  if (user.phoneNumber) {
    const smsMessage = `RentX: Booking status updated! ${vehicle.name} - Status: ${newStatus}. Booking ID: #${booking._id.toString().slice(-8).toUpperCase()}. ${statusMessage}`;

    const smsResult = await sendSMSNotification({
      to: user.phoneNumber,
      message: smsMessage,
    });

    notifications.push({ type: 'sms', ...smsResult });
  }

  return notifications;
};

/**
 * Notify about booking cancellation
 */
export const notifyBookingCancellation = async ({ user, booking, vehicle, owner, cancelledBy }) => {
  const notifications = [];

  const startDate = new Date(booking.startDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isCustomer = cancelledBy === 'customer';
  const cancellationMessage = isCustomer
    ? 'You have cancelled your booking'
    : 'Your booking has been cancelled by the owner';

  // Email notification
  if (user.email) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: #ef4444; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Booking Cancelled</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${user.fullname || user.username},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${cancellationMessage}. A refund will be processed if applicable.
          </p>

          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="color: #dc2626; margin-top: 0;">Cancelled Booking Details</h3>
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
                <td style="padding: 8px 0; color: #666;"><strong>Rental Start:</strong></td>
                <td style="padding: 8px 0; color: #333;">${startDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Amount:</strong></td>
                <td style="padding: 8px 0; color: #333;">₹${booking.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Cancelled By:</strong></td>
                <td style="padding: 8px 0; color: #ef4444;">${isCustomer ? 'You' : owner.storeName}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Refund Information:</strong> If payment was completed, your refund will be processed within 5-7 business days.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings"
               style="background: #6b7280; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              View My Bookings
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
            For questions about this cancellation, please contact support@rentx.com
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmailNotification({
      to: user.email,
      subject: `Booking Cancelled - ${vehicle.name} - RentX`,
      html: emailHtml,
    });

    notifications.push({ type: 'email', ...emailResult });
  }

  // SMS notification
  console.log("🔔 Checking if SMS should be sent to customer...");
  console.log("   └─ Customer phone number:", user.phoneNumber || "NOT SET");
  console.log("   └─ Cancelled by:", cancelledBy);

  if (user.phoneNumber) {
    console.log("✅ Sending SMS to customer...");
    const smsMessage = `RentX: Booking Cancelled! ${vehicle.name} - Booking ID: #${booking._id.toString().slice(-8).toUpperCase()}. ${cancellationMessage}. Refund will be processed if applicable.`;

    const smsResult = await sendSMSNotification({
      to: user.phoneNumber,
      message: smsMessage,
    });

    notifications.push({ type: 'sms', ...smsResult });
  } else {
    console.log("⚠️ SMS not sent to customer:");
    console.log("   └─ Reason: No phone number set");
  }

  return notifications;
};

/**
 * Notify owner about booking cancellation
 */
export const notifyOwnerBookingCancellation = async ({ owner, ownerUser, customerUser, booking, vehicle, cancelledBy }) => {
  const notifications = [];

  const ownerEmail = ownerUser?.email;
  const ownerPhone = owner.phoneNumber;

  const startDate = new Date(booking.startDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Determine cancellation message based on who cancelled
  const cancellationMessage = cancelledBy === 'customer'
    ? 'A booking for your vehicle has been cancelled by the customer.'
    : 'You have cancelled this booking.';

  // Email notification
  if (owner.notificationPreferences?.email !== false && ownerEmail) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: #ef4444; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Booking Cancelled</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${owner.storeName},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${cancellationMessage}
          </p>

          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="color: #dc2626; margin-top: 0;">Cancelled Booking Details</h3>
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
                <td style="padding: 8px 0; color: #666;"><strong>Rental Start:</strong></td>
                <td style="padding: 8px 0; color: #333;">${startDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Amount:</strong></td>
                <td style="padding: 8px 0; color: #333;">₹${booking.totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
              <strong>Good News:</strong> Your vehicle is now available for other bookings!
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner-dashboard"
               style="background: #6b7280; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              View Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
            This is an automated notification from RentX.
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmailNotification({
      to: ownerEmail,
      subject: `Booking Cancelled - ${vehicle.name} - RentX`,
      html: emailHtml,
    });

    notifications.push({ type: 'email', ...emailResult });
  }

  // SMS notification
  console.log("🔔 Checking if SMS should be sent to owner...");
  console.log("   └─ Owner phone number:", ownerPhone || "NOT SET");
  console.log("   └─ SMS preference:", owner.notificationPreferences?.sms !== false ? "ENABLED" : "DISABLED");
  console.log("   └─ Cancelled by:", cancelledBy);

  if (owner.notificationPreferences?.sms !== false && ownerPhone) {
    console.log("✅ Sending SMS to owner...");

    // Create message based on who cancelled
    const smsMessage = cancelledBy === 'customer'
      ? `RentX: Booking cancelled by customer ${customerUser.fullname || customerUser.username} for ${vehicle.name}. Booking ID: #${booking._id.toString().slice(-8).toUpperCase()}. Vehicle is now available.`
      : `RentX: You have cancelled the booking for ${vehicle.name}. Customer: ${customerUser.fullname || customerUser.username}. Booking ID: #${booking._id.toString().slice(-8).toUpperCase()}. Vehicle is now available.`;

    const smsResult = await sendSMSNotification({
      to: ownerPhone,
      message: smsMessage,
    });

    notifications.push({ type: 'sms', ...smsResult });
  } else {
    console.log("⚠️ SMS not sent to owner:");
    if (!ownerPhone) console.log("   └─ Reason: No phone number set");
    if (owner.notificationPreferences?.sms === false) console.log("   └─ Reason: SMS disabled in preferences");
  }

  return notifications;
};

export default {
  sendEmailNotification,
  sendSMSNotification,
  notifyOwnerNewBooking,
  notifyCustomerBookingConfirmed,
  notifyCustomerBookingStatusUpdate,
  notifyBookingCancellation,
  notifyOwnerBookingCancellation,
};
