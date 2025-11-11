import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { sendContactEmail } from '../utils/emailService.js';

/**
 * Handle Contact Form Submission
 * Sends email to admin (rentx.sms.alerts@gmail.com)
 * and confirmation email to user
 */
export const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Validation
  if (!name || !email || !subject || !message) {
    throw new ApiError(400, 'Please provide all required fields: name, email, subject, and message');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }

  // Phone validation (optional field)
  if (phone && phone.trim() !== '') {
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      throw new ApiError(400, 'Please provide a valid phone number');
    }
  }

  try {
    // Send emails
    await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        'Thank you for contacting us! We have received your message and will get back to you soon.',
        {
          name,
          email,
          subject,
          sentAt: new Date().toISOString(),
        }
      )
    );
  } catch (emailError) {
    console.error('Error sending contact email:', emailError);
    throw new ApiError(
      500,
      'Failed to send your message. Please try again later or contact us directly at support@rentx.com'
    );
  }
});

export default {
  submitContactForm,
};
