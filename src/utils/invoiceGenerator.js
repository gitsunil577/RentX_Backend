import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Use Rs. prefix — PDFKit built-in fonts don't support the ₹ Unicode glyph
const formatCurrency = (amount) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  return `Rs. ${formatted}`;
};

const generateInvoiceNumber = (bookingId) => {
  const timestamp = Date.now().toString().slice(-6);
  const bookingShort = bookingId.toString().slice(-4).toUpperCase();
  return `RENTX-INV-${timestamp}-${bookingShort}`;
};

// Truncate long strings so they never wrap to a new line
const trunc = (str, max) => {
  if (!str) return 'N/A';
  const s = str.toString();
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
};

/**
 * Generate PDF Invoice — guaranteed single page.
 * All text uses lineBreak:false so PDFKit never auto-creates a new page.
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
      // autoFirstPage:false lets us control the page completely
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: `Invoice - ${generateInvoiceNumber(booking._id)}`,
          Author: 'RentX - Vehicle Rental System',
          Subject: 'Booking Invoice'
        }
      });

      doc.addPage({ size: 'A4', margin: 0 });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const invoiceNumber = generateInvoiceNumber(booking._id);
      const invoiceDate   = formatDate(new Date());

      // Layout constants
      const PW   = 595;  // page width
      const PH   = 842;  // page height
      const ML   = 40;   // left margin
      const MR   = 40;   // right margin
      const CW   = PW - ML - MR;  // content width = 515

      const PRIMARY  = '#2563eb';
      const TEXT     = '#1f2937';
      const LGRAY    = '#f3f4f6';
      const BORDER   = '#e5e7eb';
      const GREEN    = '#10b981';
      const WHITE    = '#ffffff';

      // Helper: right-aligned text within content area
      const textRight = (txt, y, opts = {}) => {
        doc.text(txt, ML, y, { align: 'right', width: CW, lineBreak: false, ...opts });
      };

      // Helper: left text, no wrap
      const textLeft = (txt, x, y, opts = {}) => {
        doc.text(txt, x, y, { lineBreak: false, ...opts });
      };

      // ── HEADER ──────────────────────────────────────────────
      // Blue header band
      doc.rect(0, 0, PW, 80).fill(PRIMARY);

      doc.fontSize(28).fillColor(WHITE).font('Helvetica-Bold');
      textLeft('RentX', ML, 18);

      doc.fontSize(9).fillColor(WHITE).font('Helvetica');
      textLeft('Vehicle Rental System', ML, 52);

      doc.fontSize(22).fillColor(WHITE).font('Helvetica-Bold');
      textRight('INVOICE', 18);

      doc.fontSize(9).fillColor(GREEN).font('Helvetica-Bold');
      textRight('VERIFIED', 54);

      // ── INVOICE META ─────────────────────────────────────────
      let y = 95;

      doc.fontSize(8).fillColor(TEXT);

      doc.font('Helvetica-Bold'); textLeft('Invoice No:', ML, y);
      doc.font('Helvetica');      textLeft(invoiceNumber, 130, y);

      doc.font('Helvetica-Bold'); textLeft('Date:', 370, y);
      doc.font('Helvetica');      textLeft(invoiceDate, 405, y);

      y += 14;

      doc.font('Helvetica-Bold'); textLeft('Booking ID:', ML, y);
      doc.font('Helvetica');      textLeft(trunc(booking._id.toString().toUpperCase(), 32), 130, y);

      doc.font('Helvetica-Bold'); textLeft('Status:', 370, y);
      doc.fillColor(GREEN).font('Helvetica-Bold');
      textLeft(booking.paymentStatus || 'Paid', 405, y);

      // ── CUSTOMER / OWNER ─────────────────────────────────────
      y = 128;
      const boxH = 72;

      doc.rect(ML, y, 245, boxH).fillAndStroke(LGRAY, BORDER);
      doc.rect(310, y, 245, boxH).fillAndStroke(LGRAY, BORDER);

      // Billed To
      doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold');
      textLeft('BILLED TO', 50, y + 7);

      doc.fillColor(TEXT).fontSize(8).font('Helvetica-Bold');
      textLeft(trunc(customer.fullname || customer.username, 35), 50, y + 20);

      doc.font('Helvetica');
      textLeft(trunc(customer.email, 38), 50, y + 33);

      if (customer.phoneNumber) {
        textLeft(trunc(customer.phoneNumber, 20), 50, y + 46);
      }

      // Rental Provider
      doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold');
      textLeft('RENTAL PROVIDER', 320, y + 7);

      doc.fillColor(TEXT).fontSize(8).font('Helvetica-Bold');
      textLeft(trunc(owner.storeName, 35), 320, y + 20);

      doc.font('Helvetica');
      textLeft(trunc(owner.address || 'N/A', 38), 320, y + 33);

      if (owner.phoneNumber) {
        textLeft(trunc(owner.phoneNumber, 20), 320, y + 46);
      }

      // ── BOOKING DETAILS TABLE ────────────────────────────────
      y = 212;

      doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold');
      textLeft('BOOKING DETAILS', ML, y);

      y += 16;

      // Table header
      doc.rect(ML, y, CW, 20).fill(PRIMARY);
      doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold');
      textLeft('VEHICLE',    52,  y + 6);
      textLeft('START DATE', 240, y + 6);
      textLeft('END DATE',   340, y + 6);
      textLeft('DAYS',       470, y + 6);

      // Table row
      y += 20;
      doc.rect(ML, y, CW, 22).fillAndStroke(WHITE, BORDER);
      doc.fillColor(TEXT).fontSize(8).font('Helvetica');
      textLeft(trunc(vehicle.name, 28),              52,  y + 7);
      textLeft(formatDate(booking.startDate),        240, y + 7);
      textLeft(formatDate(booking.endDate),          340, y + 7);
      textLeft(booking.numberOfDays.toString(),      470, y + 7);

      // Locations
      y += 28;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT);
      textLeft('Pickup:', 50, y);
      doc.font('Helvetica');
      textLeft(trunc(booking.pickupLocation || 'Not specified', 65), 110, y);

      y += 14;
      doc.font('Helvetica-Bold');
      textLeft('Return:', 50, y);
      doc.font('Helvetica');
      textLeft(trunc(booking.returnLocation || 'Not specified', 65), 110, y);

      // ── PRICING BREAKDOWN ─────────────────────────────────────
      y += 22;

      // Section label
      doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold');
      textLeft('PRICING BREAKDOWN', ML, y);

      y += 16;

      // Thin separator
      doc.moveTo(ML, y).lineTo(ML + CW, y).strokeColor(BORDER).lineWidth(1).stroke();
      y += 10;

      const pricePerDay  = booking.totalAmount / booking.numberOfDays;
      const taxRate      = 0.18;
      const taxAmount    = booking.totalAmount * taxRate;
      const totalWithTax = booking.totalAmount + taxAmount;

      // Price per day row
      doc.fillColor(TEXT).fontSize(9).font('Helvetica');
      textLeft('Price per day:', 50, y);
      textRight(formatCurrency(pricePerDay), y);

      y += 15;
      textLeft(`Number of days: ${booking.numberOfDays}`, 50, y);

      y += 14;
      doc.moveTo(ML, y).lineTo(ML + CW, y).strokeColor(BORDER).lineWidth(1).stroke();
      y += 10;

      // Subtotal
      doc.font('Helvetica').fillColor(TEXT).fontSize(9);
      textLeft('Subtotal:', 50, y);
      textRight(formatCurrency(booking.totalAmount), y);

      y += 15;

      // GST
      textLeft('GST (18%):', 50, y);
      textRight(formatCurrency(taxAmount), y);

      y += 12;

      // ── TOTAL AMOUNT BOX (prominent, full-width) ─────────────
      const totalBoxH = 44;
      doc.rect(ML, y, CW, totalBoxH).fill(PRIMARY);

      // Label on the left
      doc.fillColor(WHITE).fontSize(12).font('Helvetica-Bold');
      textLeft('TOTAL RENTAL AMOUNT:', 55, y + 14);

      // Amount on the right — large and clear
      doc.fontSize(16).font('Helvetica-Bold').fillColor(WHITE);
      textRight(formatCurrency(totalWithTax), y + 13);

      // ── PAYMENT DETAILS ───────────────────────────────────────
      y += totalBoxH + 18;

      doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold');
      textLeft('PAYMENT DETAILS', ML, y);

      y += 16;

      doc.fillColor(TEXT).fontSize(8).font('Helvetica-Bold');
      textLeft('Payment Method:', 50, y);
      doc.font('Helvetica');
      textLeft(trunc(payment?.paymentMethod || 'UPI', 20), 145, y);

      doc.font('Helvetica-Bold');
      textLeft('Transaction ID:', 310, y);
      doc.font('Helvetica');
      textLeft(trunc(payment?.transactionId || 'N/A', 22), 400, y);

      y += 14;
      doc.font('Helvetica-Bold');
      textLeft('Payment Date:', 50, y);
      doc.font('Helvetica');
      textLeft(payment?.createdAt ? formatDate(payment.createdAt) : invoiceDate, 145, y);

      // ── FOOTER ───────────────────────────────────────────────
      const footerY = PH - 55;
      doc.rect(0, footerY, PW, 55).fill(LGRAY);

      doc.moveTo(0, footerY).lineTo(PW, footerY).strokeColor(PRIMARY).lineWidth(2).stroke();

      doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold');
      doc.text('Thank you for choosing RentX!', ML, footerY + 12, {
        align: 'center', width: CW, lineBreak: false
      });

      doc.fillColor(TEXT).fontSize(7.5).font('Helvetica');
      doc.text('support@rentx.com  |  +91 9876543210', ML, footerY + 28, {
        align: 'center', width: CW, lineBreak: false
      });

      doc.fillColor(GREEN).fontSize(7);
      doc.text('Computer-generated invoice — verified by RentX', ML, footerY + 41, {
        align: 'center', width: CW, lineBreak: false
      });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

export const saveInvoiceToFile = async (pdfBuffer, bookingId) => {
  try {
    const invoicesDir = path.join(__dirname, '../../invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    const fileName = `invoice_${bookingId}_${Date.now()}.pdf`;
    const filePath  = path.join(invoicesDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    return filePath;
  } catch (error) {
    console.error('Error saving invoice:', error);
    throw error;
  }
};

export const generateInvoiceForBooking = async (bookingId) => {
  try {
    const { Booking } = await import('../models/datamodels/booking.model.js');
    const { Vehicle } = await import('../models/datamodels/vehicle.model.js');
    const { User }    = await import('../models/datamodels/user.model.js');
    const { Owner }   = await import('../models/datamodels/owner.model.js');
    const { Payment } = await import('../models/datamodels/payment.model.js');

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const vehicle  = await Vehicle.findById(booking.vehicleId);
    const customer = await User.findById(booking.userId);
    const owner    = await Owner.findById(booking.ownerId);
    const payment  = await Payment.findOne({ bookingId: booking._id });

    if (!vehicle || !customer || !owner) {
      throw new Error('Missing required data for invoice generation');
    }

    return await generateInvoicePDF({ booking, vehicle, customer, owner, payment });

  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};
