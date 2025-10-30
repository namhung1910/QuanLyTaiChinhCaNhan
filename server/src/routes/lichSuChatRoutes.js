const express = require('express');
const lichSuChatController = require('../controllers/lichSuChatController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Middleware để bảo vệ tất cả các route
router.use(requireAuth);

// GET /api/lich-su-chat - Lấy lịch sử chat hiện tại
router.get('/', lichSuChatController.getChatHistory);

// POST /api/lich-su-chat/message - Lưu một message mới
router.post('/message', lichSuChatController.saveMessage);

// POST /api/lich-su-chat/messages - Lưu nhiều messages (khi tải lại trang)
router.post('/messages', lichSuChatController.saveMessages);

// DELETE /api/lich-su-chat/clear - Xóa lịch sử chat hiện tại (tạo chat mới)
router.delete('/clear', lichSuChatController.clearChatHistory);

module.exports = router;
