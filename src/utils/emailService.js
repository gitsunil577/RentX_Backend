import nodemailer from 'nodemailer';

/**
 * Email Service Utility
 * Sends emails using Nodemailer with Gmail SMTP
 */

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send Contact Form Email
 * @param {Object} contactData - Contact form data
 * @returns {Promise}
 */
export const sendContactEmail = async (contactData) => {
  const { name, email, phone, subject, message } = contactData;

  const transporter = createTransporter();

  // Email to admin
  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to the same email (rentx.sms.alerts@gmail.com)
    subject: `RentX Contact Form: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .field {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
          }
          .field-label {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
          }
          .field-value {
            color: #333;
          }
          .message-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚗 RentX Contact Form</h1>
            <p style="margin: 5px 0 0 0;">New message received</p>
          </div>
          <div class="content">
            <h2 style="color: #667eea; margin-top: 0;">Contact Details</h2>

            <div class="field">
              <div class="field-label">👤 Name:</div>
              <div class="field-value">${name}</div>
            </div>

            <div class="field">
              <div class="field-label">📧 Email:</div>
              <div class="field-value"><a href="mailto:${email}">${email}</a></div>
            </div>

            ${phone ? `
            <div class="field">
              <div class="field-label">📱 Phone:</div>
              <div class="field-value"><a href="tel:${phone}">${phone}</a></div>
            </div>
            ` : ''}

            <div class="field">
              <div class="field-label">📋 Subject:</div>
              <div class="field-value">${subject}</div>
            </div>

            <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 10px;">💬 Message:</h3>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
            </div>

            <div class="footer">
              <p>This email was sent from the RentX contact form</p>
              <p>Received on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // Email confirmation to user
  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Thank you for contacting RentX!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚗 RentX</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for reaching out!</p>
          </div>
          <div class="content">
            <h2 style="color: #667eea;">Hi ${name},</h2>
            <p>Thank you for contacting <strong>RentX</strong>! We've received your message and our team will get back to you as soon as possible.</p>

            <p><strong>Your message:</strong></p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0;">
              <p style="margin: 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 10px 0 0 0;">${message.replace(/\n/g, '<br>')}</p>
            </div>

            <p>We typically respond within 24 hours during business days. If your inquiry is urgent, please call us at <strong>+91 98765 43210</strong>.</p>

            <p>In the meantime, feel free to explore our vehicles and services:</p>

            <center>
              <a href="http://localhost:5173/vehicles" class="button">Browse Vehicles</a>
            </center>

            <div class="footer">
              <p><strong>RentX - Premium Vehicle Rentals</strong></p>
              <p>📧 Email: support@rentx.com | 📱 Phone: +91 98765 43210</p>
              <p>© ${new Date().getFullYear()} RentX. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    // Send both emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);
    return { success: true, message: 'Emails sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send OTP Email for Password Reset
 * @param {String} email - User's email address
 * @param {String} otp - 6-digit OTP
 * @param {String} userName - User's name
 * @returns {Promise}
 */
export const sendOTPEmail = async (email, otp, userName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'RentX - Password Reset OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            margin: 25px 0;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔐 RentX</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Password Reset Request</p>
          </div>
          <div class="content">
            <h2 style="color: #667eea;">Hi ${userName},</h2>
            <p>We received a request to reset your password for your <strong>RentX</strong> account. Use the OTP below to reset your password:</p>

            <div class="otp-box">
              ${otp}
            </div>

            <p style="text-align: center; color: #6c757d; font-size: 14px;">
              This OTP is valid for <strong>10 minutes</strong>
            </p>

            <div class="warning">
              <p style="margin: 0; font-weight: bold;">⚠️ Security Notice:</p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Never share this OTP with anyone</li>
                <li>RentX will never ask for your OTP via phone or email</li>
                <li>If you didn't request this reset, please ignore this email</li>
              </ul>
            </div>

            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

            <div class="footer">
              <p><strong>RentX - Premium Vehicle Rentals</strong></p>
              <p>📧 Email: support@rentx.com | 📱 Phone: +91 98765 43210</p>
              <p>© ${new Date().getFullYear()} RentX. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('OTP email sending error:', error);
    throw error;
  }
};

export default {
  sendContactEmail,
  sendOTPEmail,
};
