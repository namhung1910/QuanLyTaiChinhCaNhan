const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const ChatbotController = require('./chatbotController');

const chatbotController = new ChatbotController();

// Middleware xác thực cho tất cả routes
router.use(requireAuth);

// POST /api/chatbot/message - Gửi tin nhắn cho chatbot
router.post('/message', async (req, res) => {
  await chatbotController.processMessage(req, res);
});

// GET /api/chatbot/suggestions - Lấy gợi ý câu hỏi
router.get('/suggestions', async (req, res) => {
  await chatbotController.getSuggestedQuestions(req, res);
});

// GET /api/chatbot/summary - Lấy tóm tắt tài chính nhanh
router.get('/summary', async (req, res) => {
  await chatbotController.getQuickSummary(req, res);
});

// GET /api/chatbot/test-gemini - Test kết nối Gemini AI
router.get('/test-gemini', async (req, res) => {
  await chatbotController.testGeminiConnection(req, res);
});

module.exports = router;
