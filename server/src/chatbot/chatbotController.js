const FinancialAnalysisService = require('./financialAnalysisService');
const GeminiService = require('./geminiService');
const LichSuChat = require('../models/LichSuChat');

class ChatbotController {
  constructor() {
    this.geminiService = new GeminiService();
  }

  // Xử lý tin nhắn từ người dùng
  async processMessage(req, res) {
    try {
      const { message } = req.body;
      const userId = req.user.id;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tin nhắn không được để trống' 
        });
      }

      // Lấy dữ liệu tài chính của người dùng
      const financialAnalysis = new FinancialAnalysisService(userId);
      const financialData = await financialAnalysis.getAllFinancialData();

       // Debug: Log dữ liệu tài chính
       console.log('Financial data for chatbot:', {
         expenseByCategory: financialData.expenseByCategory,
         incomeByCategory: financialData.incomeByCategory,
         currentMonth: financialData.currentMonth,
         overall: financialData.overall
       });

      // Xử lý câu hỏi với Gemini AI - Luôn sử dụng Gemini, không fallback
      console.log('Sending request to Gemini AI...');
      const aiResponse = await this.geminiService.processUserQuestion(message, financialData);
      console.log('Gemini AI response received successfully');

      // Lưu lịch sử chat vào database
      await this.saveChatHistory(userId, message, aiResponse);

      res.json({
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString()
      });

     } catch (error) {
       console.error('Error processing chatbot message:', error);
       res.status(500).json({
         success: false,
         message: `Lỗi Gemini AI: ${error.message}. Vui lòng thử lại sau.`,
         error: error.message,
         isGeminiError: true
       });
     }
  }

  // Lấy gợi ý câu hỏi mẫu (không sử dụng Gemini)
  async getSuggestedQuestions(req, res) {
    try {
      // Trả về gợi ý câu hỏi mẫu ngay lập tức
      const suggestedQuestions = [
        "Tôi chi tiêu nhiều nhất ở đâu?",
        "Tháng này tôi có tiết kiệm được không?",
        "Tôi nên làm gì để quản lý tài chính tốt hơn?",
        "Ngân sách của tôi có ổn không?",
        "So với tháng trước, tài chính của tôi thế nào?"
      ];

      res.json({
        success: true,
        suggestedQuestions,
        timestamp: new Date().toISOString()
      });

     } catch (error) {
       console.error('Error getting suggested questions:', error);
       res.status(500).json({
         success: false,
         message: 'Có lỗi xảy ra khi lấy gợi ý câu hỏi. Vui lòng thử lại sau.',
         error: error.message
       });
     }
  }

  // Lấy tóm tắt tài chính nhanh
  async getQuickSummary(req, res) {
    try {
      const userId = req.user.id;

      // Lấy dữ liệu tài chính cơ bản
      const financialAnalysis = new FinancialAnalysisService(userId);
      const financialData = await financialAnalysis.getAllFinancialData();

      const summary = {
        currentBalance: financialData.overall.currentBalance,
        monthlyIncome: financialData.currentMonth.monthlyIncome,
        monthlyExpense: financialData.currentMonth.monthlyExpense,
        topExpenseCategory: financialData.expenseByCategory[0]?.categoryName || 'Chưa có dữ liệu',
        topExpenseAmount: financialData.expenseByCategory[0]?.total || 0,
        budgetAlerts: financialData.budgetData.filter(b => b.isOverLimit || b.isNearLimit).length,
        totalTransactions: financialData.overall.totalTransactions
      };

      res.json({
        success: true,
        summary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting quick summary:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy tóm tắt tài chính. Vui lòng thử lại sau.',
        error: error.message
      });
    }
  }



   // Test kết nối Gemini AI
   async testGeminiConnection(req, res) {
     try {
       const testResponse = await this.geminiService.processUserQuestion(
         "Xin chào, bạn có hoạt động không?", 
         { overall: { totalIncome: 0, totalExpense: 0, currentBalance: 0 } }
       );
       
       res.json({
         success: true,
         message: 'Gemini AI is working',
         response: testResponse
       });
     } catch (error) {
       res.json({
         success: false,
         message: 'Gemini AI is not working',
         error: error.message
       });
     }
   }

   // Lưu lịch sử chat (có thể implement sau khi có model ChatHistory)
   async saveChatHistory(userId, userMessage, aiResponse) {
     try {
       // Tìm hoặc tạo chat history cho user
       let chatHistory = await LichSuChat.findOne({ 
         nguoiDung: userId
       });

       if (!chatHistory) {
         chatHistory = await LichSuChat.create({
           nguoiDung: userId,
           messages: []
         });
       }

       // Tạo message objects
       const userMessageObj = {
         id: `user_${Date.now()}`,
         type: 'user',
         content: userMessage,
         timestamp: new Date().toISOString()
       };

       const botMessageObj = {
         id: `bot_${Date.now()}`,
         type: 'bot',
         content: aiResponse,
         timestamp: new Date().toISOString()
       };

       // Thêm messages vào lịch sử
       await chatHistory.addMessage(userMessageObj);
       await chatHistory.addMessage(botMessageObj);

       console.log('Chat history saved successfully');
     } catch (error) {
       console.error('Error saving chat history:', error);
       // Không throw error để không ảnh hưởng đến response chính
     }
   }
}

module.exports = ChatbotController;
