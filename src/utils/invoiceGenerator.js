import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Format date to readable string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format currency to INR
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

/**
 * Generate a unique invoice number
 */
const generateInvoiceNumber = (bookingId) => {
  const timestamp = Date.now().toString().slice(-6);
  const bookingShort = bookingId.toString().slice(-4).toUpperCase();
  return `RENTX-INV-${timestamp}-${bookingShort}`;
};

/**
 * Generate PDF Invoice for a booking
 * @param {Object} options - Invoice generation options
 * @param {Object} options.booking - Booking details
 * @param {Object} options.vehicle - Vehicle details
 * @param {Object} options.customer - Customer details
 * @param {Object} options.owner - Owner details
 * @param {Object} options.payment - Payment details
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateInvoicePDF = async ({
  booking,
  vehicle,
  customer,
  owner,
  payment
}) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice - ${generateInvoiceNumber(booking._id)}`,
          Author: 'RentX - Vehicle Rental System',
          Subject: 'Booking Invoice',
          Keywords: 'invoice, rental, booking'
        }
      });

      // Buffer to store PDF
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber(booking._id);
      const invoiceDate = formatDate(new Date());

      // Colors
      const primaryColor = '#2563eb'; // Blue
      const textColor = '#1f2937'; // Dark gray
      const lightGray = '#f3f4f6';
      const borderColor = '#e5e7eb';

      // =====================
      // HEADER WITH LOGO
      // =====================
      doc.fontSize(28)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('RentX', 50, 50);

      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica')
         .text('Vehicle Rental System', 50, 85);

      // Invoice title on right
      doc.fontSize(24)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('INVOICE', 400, 50, { align: 'right' });

      // Verified badge
      doc.fontSize(10)
         .fillColor('#10b981') // Green
         .font('Helvetica-Bold')
         .text('✓ VERIFIED BY RENTX', 400, 80, { align: 'right' });

      // Line separator
      doc.moveTo(50, 110)
         .lineTo(545, 110)
         .strokeColor(primaryColor)
         .lineWidth(2)
         .stroke();

      // =====================
      // INVOICE DETAILS
      // =====================
      let yPosition = 130;

      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Invoice Number:', 50, yPosition);

      doc.font('Helvetica')
         .text(invoiceNumber, 150, yPosition);

      doc.font('Helvetica-Bold')
         .text('Invoice Date:', 350, yPosition);

      doc.font('Helvetica')
         .text(invoiceDate, 430, yPosition);

      yPosition += 20;

      doc.font('Helvetica-Bold')
         .text('Booking ID:', 50, yPosition);

      doc.font('Helvetica')
         .text(booking._id.toString().toUpperCase(), 150, yPosition);

      doc.font('Helvetica-Bold')
         .text('Payment Status:', 350, yPosition);

      doc.fillColor('#10b981')
         .font('Helvetica-Bold')
         .text(booking.paymentStatus || 'Paid', 430, yPosition);

      // =====================
      // CUSTOMER & OWNER INFO
      // =====================
      yPosition = 180;

      // Background boxes
      doc.rect(50, yPosition, 235, 100)
         .fillAndStroke(lightGray, borderColor);

      doc.rect(310, yPosition, 235, 100)
         .fillAndStroke(lightGray, borderColor);

      // Customer details
      yPosition += 15;
      doc.fillColor(primaryColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('BILLED TO', 60, yPosition);

      yPosition += 20;
      doc.fillColor(textColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(customer.fullname || customer.username, 60, yPosition);

      yPosition += 15;
      doc.font('Helvetica')
         .text(customer.email, 60, yPosition);

      if (customer.phoneNumber) {
        yPosition += 15;
        doc.text(customer.phoneNumber, 60, yPosition);
      }

      // Owner details
      yPosition = 195;
      doc.fillColor(primaryColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('RENTAL PROVIDER', 320, yPosition);

      yPosition += 20;
      doc.fillColor(textColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(owner.storeName, 320, yPosition);

      yPosition += 15;
      doc.font('Helvetica')
         .text(owner.address || 'N/A', 320, yPosition, { width: 215 });

      if (owner.phoneNumber) {
        yPosition += 15;
        doc.text(owner.phoneNumber, 320, yPosition);
      }

      // =====================
      // BOOKING DETAILS TABLE
      // =====================
      yPosition = 310;

      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('BOOKING DETAILS', 50, yPosition);

      yPosition += 25;

      // Table header
      doc.rect(50, yPosition, 495, 25)
         .fillAndStroke(primaryColor, primaryColor);

      doc.fillColor('#ffffff')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('VEHICLE', 60, yPosition + 8)
         .text('START DATE', 250, yPosition + 8)
         .text('END DATE', 350, yPosition + 8)
         .text('DAYS', 450, yPosition + 8);

      // Table content
      yPosition += 25;
      doc.rect(50, yPosition, 495, 30)
         .fillAndStroke('#ffffff', borderColor);

      doc.fillColor(textColor)
         .font('Helvetica')
         .text(vehicle.name, 60, yPosition + 10, { width: 180 })
         .text(formatDate(booking.startDate), 250, yPosition + 10)
         .text(formatDate(booking.endDate), 350, yPosition + 10)
         .text(booking.numberOfDays.toString(), 450, yPosition + 10);

      // =====================
      // RENTAL LOCATIONS
      // =====================
      yPosition += 50;

      doc.fillColor(textColor)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Pickup Location:', 60, yPosition);

      doc.font('Helvetica')
         .text(booking.pickupLocation, 160, yPosition, { width: 380 });

      yPosition += 20;

      doc.font('Helvetica-Bold')
         .text('Return Location:', 60, yPosition);

      doc.font('Helvetica')
         .text(booking.returnLocation, 160, yPosition, { width: 380 });

      // =====================
      // PRICING BREAKDOWN
      // =====================
      yPosition += 40;

      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('PRICING BREAKDOWN', 50, yPosition);

      yPosition += 25;

      // Price per day
      const pricePerDay = booking.totalAmount / booking.numberOfDays;

      doc.fillColor(textColor)
         .fontSize(10)
         .font('Helvetica')
         .text('Price per day:', 60, yPosition);

      doc.text(formatCurrency(pricePerDay), 450, yPosition, { align: 'right' });

      yPosition += 20;

      doc.text(`Number of days: ${booking.numberOfDays}`, 60, yPosition);

      yPosition += 20;

      // Separator line
      doc.moveTo(50, yPosition)
         .lineTo(545, yPosition)
         .strokeColor(borderColor)
         .lineWidth(1)
         .stroke();

      yPosition += 15;

      // Subtotal
      doc.font('Helvetica')
         .text('Subtotal:', 60, yPosition);

      doc.text(formatCurrency(booking.totalAmount), 450, yPosition, { align: 'right' });

      yPosition += 20;

      // Tax (GST - 18% for illustration, adjust as needed)
      const taxRate = 0.18; // 18% GST
      const taxAmount = booking.totalAmount * taxRate;

      doc.text('GST (18%):', 60, yPosition);
      doc.text(formatCurrency(taxAmount), 450, yPosition, { align: 'right' });

      yPosition += 25;

      // Total background
      doc.rect(50, yPosition - 5, 495, 30)
         .fillAndStroke(lightGray, borderColor);

      // Total amount
      const totalWithTax = booking.totalAmount + taxAmount;

      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('TOTAL AMOUNT:', 60, yPosition + 5);

      doc.fontSize(14)
         .text(formatCurrency(totalWithTax), 450, yPosition + 5, { align: 'right' });

      // =====================
      // PAYMENT DETAILS
      // =====================
      yPosition += 50;

      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('PAYMENT DETAILS', 50, yPosition);

      yPosition += 25;

      doc.fillColor(textColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Payment Method:', 60, yPosition);

      doc.font('Helvetica')
         .text(payment?.paymentMethod || 'UPI', 160, yPosition);

      yPosition += 20;

      doc.font('Helvetica-Bold')
         .text('Transaction ID:', 60, yPosition);

      doc.font('Helvetica')
         .text(payment?.transactionId || 'N/A', 160, yPosition);

      yPosition += 20;

      doc.font('Helvetica-Bold')
         .text('Payment Date:', 60, yPosition);

      doc.font('Helvetica')
         .text(payment?.createdAt ? formatDate(payment.createdAt) : invoiceDate, 160, yPosition);

      // =====================
      // FOOTER
      // =====================
      const pageHeight = doc.page.height;

      // Footer background
      doc.rect(0, pageHeight - 100, 595, 100)
         .fillAndStroke(lightGray, lightGray);

      // Thank you message
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Thank you for choosing RentX!', 50, pageHeight - 75, {
           align: 'center',
           width: 495
         });

      // Contact info
      doc.fillColor(textColor)
         .fontSize(9)
         .font('Helvetica')
         .text('For any queries, please contact us at support@rentx.com | +91 9876543210', 50, pageHeight - 50, {
           align: 'center',
           width: 495
         });

      // Verified message
      doc.fontSize(8)
         .fillColor('#10b981')
         .text('This is a computer-generated invoice verified and issued by RentX', 50, pageHeight - 30, {
           align: 'center',
           width: 495
         });

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Save invoice PDF to file system
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {String} bookingId - Booking ID
 * @returns {Promise<String>} - File path
 */
export const saveInvoiceToFile = async (pdfBuffer, bookingId) => {
  try {
    // Create invoices directory if it doesn't exist
    const invoicesDir = path.join(__dirname, '../../invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    // Generate file name
    const fileName = `invoice_${bookingId}_${Date.now()}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    // Write file
    fs.writeFileSync(filePath, pdfBuffer);

    console.log(`✅ Invoice saved: ${filePath}`);
    return filePath;

  } catch (error) {
    console.error('❌ Error saving invoice:', error);
    throw error;
  }
};

/**
 * Generate invoice and return buffer
 * @param {String} bookingId - Booking ID
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateInvoiceForBooking = async (bookingId) => {
  try {
    // Import models (using dynamic import to avoid circular dependencies)
    const { Booking } = await import('../models/datamodels/booking.model.js');
    const { Vehicle } = await import('../models/datamodels/vehicle.model.js');
    const { User } = await import('../models/datamodels/user.model.js');
    const { Owner } = await import('../models/datamodels/owner.model.js');
    const { Payment } = await import('../models/datamodels/payment.model.js');

    // Fetch booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Fetch related data
    const vehicle = await Vehicle.findById(booking.vehicleId);
    const customer = await User.findById(booking.userId);
    const owner = await Owner.findById(booking.ownerId);
    const payment = await Payment.findOne({ bookingId: booking._id });

    if (!vehicle || !customer || !owner) {
      throw new Error('Missing required data for invoice generation');
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      booking,
      vehicle,
      customer,
      owner,
      payment
    });

    return pdfBuffer;

  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    throw error;
  }
};
