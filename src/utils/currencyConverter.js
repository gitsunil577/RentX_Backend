/**
 * Currency Conversion Utility
 * Converts USD to INR for the E-Rental System
 */

// Exchange rate: 1 USD = 83 INR (approximate, update as needed)
const USD_TO_INR_RATE = 83;

/**
 * Convert USD amount to INR
 * @param {number} amountInUSD - Amount in US Dollars
 * @returns {number} - Amount in Indian Rupees (rounded to 2 decimal places)
 */
export const convertUSDtoINR = (amountInUSD) => {
  if (!amountInUSD || isNaN(amountInUSD) || amountInUSD < 0) {
    throw new Error("Invalid USD amount");
  }

  const amountInINR = amountInUSD * USD_TO_INR_RATE;
  return Math.round(amountInINR * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert INR amount to USD
 * @param {number} amountInINR - Amount in Indian Rupees
 * @returns {number} - Amount in US Dollars (rounded to 2 decimal places)
 */
export const convertINRtoUSD = (amountInINR) => {
  if (!amountInINR || isNaN(amountInINR) || amountInINR < 0) {
    throw new Error("Invalid INR amount");
  }

  const amountInUSD = amountInINR / USD_TO_INR_RATE;
  return Math.round(amountInUSD * 100) / 100; // Round to 2 decimal places
};

/**
 * Get current exchange rate
 * @returns {number} - Current USD to INR exchange rate
 */
export const getExchangeRate = () => {
  return USD_TO_INR_RATE;
};

/**
 * Convert INR rupees to paise (for Razorpay)
 * @param {number} amountInRupees - Amount in Rupees
 * @returns {number} - Amount in Paise (1 Rupee = 100 Paise)
 */
export const convertRupeesToPaise = (amountInRupees) => {
  if (!amountInRupees || isNaN(amountInRupees) || amountInRupees < 0) {
    throw new Error("Invalid rupees amount");
  }
  return Math.round(amountInRupees * 100); // Convert to paise and round
};

/**
 * Convert paise to INR rupees (from Razorpay)
 * @param {number} amountInPaise - Amount in Paise
 * @returns {number} - Amount in Rupees
 */
export const convertPaiseToRupees = (amountInPaise) => {
  if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 0) {
    throw new Error("Invalid paise amount");
  }
  return Math.round((amountInPaise / 100) * 100) / 100; // Convert to rupees with 2 decimal places
};

/**
 * Format amount to INR currency string
 * @param {number} amount - Amount in INR
 * @returns {string} - Formatted currency string
 */
export const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format amount to USD currency string
 * @param {number} amount - Amount in USD
 * @returns {string} - Formatted currency string
 */
export const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default {
  convertUSDtoINR,
  convertINRtoUSD,
  getExchangeRate,
  convertRupeesToPaise,
  convertPaiseToRupees,
  formatINR,
  formatUSD,
};
