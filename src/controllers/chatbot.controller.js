import { getAIResponse, checkAIServiceHealth } from '../utils/aiChatbotService.js';

/**
 * Chatbot Controller
 * Handles AI-powered customer support chat requests
 */

/**
 * POST /api/chatbot/message
 * Send a message to the AI chatbot
 * @body {String} message - User's message
 * @body {Array} conversationHistory - Previous messages (optional)
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string',
      });
    }

    // Limit message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long. Please keep it under 1000 characters.',
      });
    }

    // Validate conversation history if provided
    if (conversationHistory && !Array.isArray(conversationHistory)) {
      return res.status(400).json({
        success: false,
        message: 'conversationHistory must be an array',
      });
    }

    // Get AI response
    const result = await getAIResponse(
      message.trim(),
      conversationHistory || []
    );

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        response: result.response,
        isAI: result.isAI,
        needsEscalation: result.needsEscalation,
        supportEmail: result.supportEmail,
        timestamp: new Date().toISOString(),
      },
      message: result.isAI
        ? 'AI response generated successfully'
        : 'Fallback response provided',
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process chatbot message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/chatbot/health
 * Check chatbot AI service health status
 */
export const getHealthStatus = async (req, res) => {
  try {
    const health = checkAIServiceHealth();

    return res.status(200).json({
      success: true,
      data: health,
      message: 'Health check completed',
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/chatbot/support-info
 * Get support contact information
 */
export const getSupportInfo = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        email: process.env.EMAIL_USER,
        phone: '+91 98765 43210',
        supportHours: 'Monday - Saturday: 9 AM - 6 PM IST',
        responseTime: 'Within 24 hours',
      },
      message: 'Support information retrieved',
    });
  } catch (error) {
    console.error('Support info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve support information',
    });
  }
};

export default {
  sendMessage,
  getHealthStatus,
  getSupportInfo,
};
