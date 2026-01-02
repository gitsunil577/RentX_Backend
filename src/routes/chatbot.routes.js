import express from 'express';
import {
  sendMessage,
  getHealthStatus,
  getSupportInfo,
} from '../controllers/chatbot.controller.js';

const router = express.Router();

/**
 * Chatbot Routes
 * Public routes - no authentication required for customer support
 */

// POST /api/chatbot/message - Send message to AI chatbot
router.post('/message', sendMessage);

// GET /api/chatbot/health - Check AI service health
router.get('/health', getHealthStatus);

// GET /api/chatbot/support-info - Get support contact information
router.get('/support-info', getSupportInfo);

export default router;
