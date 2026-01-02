/**
 * AI Chatbot Service
 * Provides intelligent rule-based customer support for E-Rental System
 */

// System context and instructions for the AI
const SYSTEM_CONTEXT = `You are a helpful customer support assistant for RentX, an E-Rental Vehicle System.

COMPANY INFORMATION:
- Name: RentX - Premium Vehicle Rentals
- Services: Car and bike rental services
- Payment: Integrated with Razorpay
- Additional Services: Driver service available at ₹500/day
- Support Email: ${process.env.EMAIL_USER}
- Support Phone: +91 98765 43210

FEATURES:
- Wide range of vehicles (cars and bikes)
- Flexible rental durations
- Insurance coverage available
- Pickup and delivery services
- Secure online payments via Razorpay
- Real-time booking system
- Customer account management

PRICING:
- Varies by vehicle type and duration
- Special discounts for long-term rentals
- Insurance optional but recommended

BOOKING PROCESS:
1. Browse available vehicles
2. Select vehicle and rental dates
3. Add to cart
4. Proceed to checkout
5. Make payment via Razorpay
6. Receive booking confirmation

POLICIES:
- Cancellation: Refunds available based on timing
- Valid driver's license required
- Security deposit may be required
- Insurance available for all rentals

YOUR ROLE:
- Answer questions about vehicles, pricing, booking, and services
- Be helpful, friendly, and concise
- If you cannot answer a complex technical question or issue, acknowledge it and suggest contacting support
- Keep responses under 100 words when possible
- Use a professional but friendly tone
- For account-specific issues, billing problems, or technical issues, provide the support email

IMPORTANT:
- Do NOT make up pricing information - say it varies by vehicle
- Do NOT guarantee refunds - say it depends on policy
- Do NOT provide fake booking references or order numbers
- If unsure, recommend contacting support at ${process.env.EMAIL_USER}`;

/**
 * Get intelligent chatbot response
 * @param {String} userMessage - User's question
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<Object>} - Chatbot response with metadata
 */
export const getAIResponse = async (userMessage, conversationHistory = []) => {
  try {
    // Get intelligent rule-based response
    const chatbotResponse = getIntelligentResponse(userMessage, conversationHistory);

    // Detect if escalation is needed
    const needsEscalation = detectEscalation(chatbotResponse, userMessage);

    return {
      success: true,
      response: chatbotResponse,
      isAI: true,
      needsEscalation,
      supportEmail: process.env.EMAIL_USER,
      error: null,
    };
  } catch (error) {
    console.error('Chatbot Error:', error);

    return {
      success: false,
      response: getIntelligentResponse(userMessage),
      isAI: false,
      needsEscalation: false,
      supportEmail: process.env.EMAIL_USER,
      error: error.message,
    };
  }
};

/**
 * Detect if the query needs escalation to human support
 * @param {String} aiResponse - AI's response
 * @param {String} userMessage - User's original question
 * @returns {Boolean}
 */
const detectEscalation = (aiResponse, userMessage) => {
  const escalationKeywords = [
    'contact support',
    'email support',
    'call us',
    'reach out',
    'contact our team',
    'support team',
    'customer service',
    'i cannot',
    'i don\'t have',
    'not sure',
    'unable to',
  ];

  const complexIssues = [
    'refund',
    'complaint',
    'dispute',
    'not working',
    'broken',
    'accident',
    'emergency',
    'legal',
    'police',
    'damage',
    'fraud',
    'scam',
    'unauthorized',
  ];

  const responseLower = aiResponse.toLowerCase();
  const messageLower = userMessage.toLowerCase();

  // Check if AI suggests contacting support
  const aiSuggestsContact = escalationKeywords.some(keyword =>
    responseLower.includes(keyword)
  );

  // Check if user message indicates complex issue
  const isComplexIssue = complexIssues.some(keyword =>
    messageLower.includes(keyword)
  );

  return aiSuggestsContact || isComplexIssue;
};

/**
 * Get intelligent rule-based response
 * @param {String} userMessage - User's question
 * @param {Array} conversationHistory - Previous messages for context (optional)
 * @returns {String} - Intelligent response
 */
const getIntelligentResponse = (userMessage, conversationHistory = []) => {
  const lowerMessage = userMessage.toLowerCase();

  // Greetings
  if (lowerMessage.match(/^(hi|hello|hey|good morning|good evening|good afternoon)/)) {
    return "Hello! 👋 Welcome to RentX! I'm here to help you with vehicle rentals, bookings, pricing, and more. How can I assist you today?";
  }

  // Vehicle queries
  if (lowerMessage.includes('vehicle') || lowerMessage.includes('car') || lowerMessage.includes('bike')) {
    return "We offer a wide range of cars and bikes for rent! You can browse our vehicles on the website, filter by type, and check real-time availability. Would you like to know about pricing, booking process, or specific vehicle features?";
  }

  // Pricing
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('rate')) {
    return "Our pricing varies by vehicle type, rental duration, and season. You can see exact prices when you select a vehicle on our website. We also offer discounts for long-term rentals. Would you like to browse vehicles now?";
  }

  // Booking
  if (lowerMessage.includes('book') || lowerMessage.includes('rent') || lowerMessage.includes('reserve')) {
    return "Booking is easy! Just: 1) Browse vehicles, 2) Select dates, 3) Add to cart, 4) Checkout with Razorpay payment. Your booking confirmation will be sent via email. Need help with a specific step?";
  }

  // Payment
  if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
    return "We accept secure online payments through Razorpay. You can pay using credit/debit cards, UPI, net banking, or wallets. All transactions are encrypted and secure. Having payment issues? Contact support at " + process.env.EMAIL_USER;
  }

  // Insurance
  if (lowerMessage.includes('insurance')) {
    return "We offer comprehensive insurance coverage for all rentals. It's optional but highly recommended for your peace of mind. Insurance details and pricing are shown during the booking process.";
  }

  // Driver service
  if (lowerMessage.includes('driver')) {
    return "Yes! We provide professional driver services at ₹500 per day. You can add this service when booking your vehicle. Our drivers are experienced and verified.";
  }

  // Location/Pickup
  if (lowerMessage.includes('location') || lowerMessage.includes('pickup') || lowerMessage.includes('deliver')) {
    return "We offer both pickup and delivery services. You can choose your preferred location during booking. Delivery charges may apply based on distance. Want to know about specific locations?";
  }

  // Contact/Support
  if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help')) {
    return `For personalized assistance, you can reach our support team:\n📧 Email: ${process.env.EMAIL_USER}\n📱 Phone: +91 98765 43210\n\nWhat else can I help you with?`;
  }

  // Account issues
  if (lowerMessage.includes('account') || lowerMessage.includes('login') || lowerMessage.includes('register') || lowerMessage.includes('password')) {
    return "For account-related issues (login, password reset, registration), please use the login/signup page. If you're facing technical issues, contact our support team at " + process.env.EMAIL_USER;
  }

  // Cancellation
  if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
    return "Cancellation and refund policies vary based on timing and booking terms. For specific refund requests or cancellation assistance, please contact our support team at " + process.env.EMAIL_USER + " with your booking details.";
  }

  // Availability
  if (lowerMessage.includes('available') || lowerMessage.includes('availability')) {
    return "You can check real-time vehicle availability on our website. Just select your desired dates and location, and you'll see all available vehicles. Want to browse vehicles now?";
  }

  // Goodbye
  if (lowerMessage.match(/bye|goodbye|see you|thanks|thank you/)) {
    return "Thank you for choosing RentX! If you need anything else, I'm always here to help. Have a great day! 🚗";
  }

  // Default response
  return `I'm here to help with information about vehicles, bookings, pricing, and services. For specific or complex queries, please contact our support team:\n\n📧 ${process.env.EMAIL_USER}\n📱 +91 98765 43210\n\nWhat would you like to know?`;
};

/**
 * Check chatbot service health
 * @returns {Object} - Service status
 */
export const checkAIServiceHealth = () => {
  return {
    service: 'Intelligent Rule-Based Chatbot',
    status: 'active',
    type: 'rule-based',
    supportEmail: process.env.EMAIL_USER,
  };
};

export default {
  getAIResponse,
  checkAIServiceHealth,
};
