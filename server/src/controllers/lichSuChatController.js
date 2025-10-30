const LichSuChat = require('../models/LichSuChat');

/**
 * Helper function: Tìm lịch sử chat của user, nếu chưa có thì tạo mới.
 * Giúp loại bỏ việc lặp code trong nhiều hàm.
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Document>} - Document lịch sử chat
 */
async function findOrCreateChatHistory(userId) {
    let chatHistory = await LichSuChat.findOne({ nguoiDung: userId });

    if (!chatHistory) {
        chatHistory = await LichSuChat.create({ nguoiDung: userId, messages: [] });
    }
    return chatHistory;
}

// Lấy lịch sử chat của người dùng
async function getChatHistory(req, res) {
    try {
        const chatHistory = await findOrCreateChatHistory(req.user.id);

        // Giả sử model 'LichSuChat' có method này, giữ nguyên logic cũ
        const recentMessages = chatHistory.getRecentMessages(50);

        res.json({
            success: true,
            chatHistory: {
                _id: chatHistory._id,
                messages: recentMessages,
                lastMessageAt: chatHistory.lastMessageAt,
            },
        });
    } catch (error) {
        console.error('Lỗi lấy lịch sử chat:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

// Lưu message mới vào lịch sử
async function saveMessage(req, res) {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'object' || !message.id || !message.content) {
            return res.status(400).json({ success: false, message: 'Dữ liệu message không hợp lệ' });
        }

        const chatHistory = await findOrCreateChatHistory(req.user.id);

        // Giả sử model 'LichSuChat' có method này, giữ nguyên logic cũ
        await chatHistory.addMessage(message);

        res.json({ success: true, message: 'Lưu message thành công' });
    } catch (error) {
        console.error('Lỗi lưu message:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

// Lưu nhiều messages cùng lúc (hiệu quả hơn)
async function saveMessages(req, res) {
    try {
        const { messages } = req.body;

        if (!Array.isArray(messages)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu messages phải là array' });
        }
        
        const lastMessageAt = messages.length > 0 ? new Date(messages[messages.length - 1].timestamp) : new Date();

        // Tối ưu: Dùng 1 lệnh DB duy nhất để tìm và cập nhật, hoặc tạo mới nếu chưa có.
        await LichSuChat.findOneAndUpdate(
            { nguoiDung: req.user.id },
            { messages: messages, lastMessageAt: lastMessageAt },
            { upsert: true, new: true } // upsert: true = update or insert
        );

        res.json({ success: true, message: 'Lưu messages thành công' });
    } catch (error) {
        console.error('Lỗi lưu messages:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

// Xóa lịch sử chat (hiệu quả hơn)
async function clearChatHistory(req, res) {
    try {
        // Tối ưu: Dùng 1 lệnh DB duy nhất để tìm và reset, hoặc tạo mới nếu chưa có.
        const newChatHistory = await LichSuChat.findOneAndUpdate(
            { nguoiDung: req.user.id },
            { messages: [], lastMessageAt: new Date() },
            { upsert: true, new: true } // upsert: true = update or insert
        );

        res.json({
            success: true,
            message: 'Tạo chat mới thành công',
            chatHistory: {
                _id: newChatHistory._id,
                messages: newChatHistory.messages,
                lastMessageAt: newChatHistory.lastMessageAt,
            },
        });
    } catch (error) {
        console.error('Lỗi tạo chat mới:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

module.exports = {
    getChatHistory,
    saveMessage,
    saveMessages,
    clearChatHistory,
};