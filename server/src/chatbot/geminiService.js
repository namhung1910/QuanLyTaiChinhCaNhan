const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      console.warn('Gemini API key not found or invalid. Using fallback mode.');
      this.model = null;
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log('Gemini AI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      this.model = null;
    }
  }

  // Tạo prompt context cho chatbot dựa trên dữ liệu tài chính
  createFinancialContext(financialData) {
    const {
      overall,
      currentMonth,
      previousMonth,
      expenseByCategory,
      incomeByCategory,
      budgetData,
      spendingTrends,
      recentTransactions,
      categoryDetails
    } = financialData;

    // Tính toán các chỉ số quan trọng
    const monthlyComparison = {
      incomeChange: currentMonth.monthlyIncome - previousMonth.prevMonthlyIncome,
      expenseChange: currentMonth.monthlyExpense - previousMonth.prevMonthlyExpense,
      incomeChangePercent: previousMonth.prevMonthlyIncome > 0 
        ? ((currentMonth.monthlyIncome - previousMonth.prevMonthlyIncome) / previousMonth.prevMonthlyIncome) * 100 
        : 0,
      expenseChangePercent: previousMonth.prevMonthlyExpense > 0 
        ? ((currentMonth.monthlyExpense - previousMonth.prevMonthlyExpense) / previousMonth.prevMonthlyExpense) * 100 
        : 0
    };

    const topExpenseCategory = expenseByCategory[0];
    const topIncomeCategory = incomeByCategory[0];
    
    const overBudgetCategories = budgetData.filter(b => b.isOverLimit);
    const nearBudgetCategories = budgetData.filter(b => b.isNearLimit);

    return `
Bạn là một chuyên gia tư vấn tài chính cá nhân thông minh tên là Fingy. Dưới đây là dữ liệu tài chính của người dùng:

=== TỔNG QUAN TÀI CHÍNH ===
- Tổng thu nhập: ${overall.totalIncome.toLocaleString()} VNĐ (${overall.incomeCount} giao dịch)
- Tổng chi tiêu: ${overall.totalExpense.toLocaleString()} VNĐ (${overall.expenseCount} giao dịch)
- Số dư hiện tại: ${overall.currentBalance.toLocaleString()} VNĐ
- Tổng số giao dịch: ${overall.totalTransactions}

=== THÁNG HIỆN TẠI ===
- Thu nhập tháng này: ${currentMonth.monthlyIncome.toLocaleString()} VNĐ (${currentMonth.monthlyIncomeCount} giao dịch)
- Chi tiêu tháng này: ${currentMonth.monthlyExpense.toLocaleString()} VNĐ (${currentMonth.monthlyExpenseCount} giao dịch)

=== SO SÁNH VỚI THÁNG TRƯỚC ===
- Thu nhập: ${monthlyComparison.incomeChange >= 0 ? 'tăng' : 'giảm'} ${Math.abs(monthlyComparison.incomeChangePercent).toFixed(1)}% (${monthlyComparison.incomeChange >= 0 ? '+' : ''}${monthlyComparison.incomeChange.toLocaleString()} VNĐ)
- Chi tiêu: ${monthlyComparison.expenseChange >= 0 ? 'tăng' : 'giảm'} ${Math.abs(monthlyComparison.expenseChangePercent).toFixed(1)}% (${monthlyComparison.expenseChange >= 0 ? '+' : ''}${monthlyComparison.expenseChange.toLocaleString()} VNĐ)

=== CHI TIÊU THEO DANH MỤC ===
${expenseByCategory.slice(0, 5).map((cat, index) => 
  `${index + 1}. ${cat.categoryName}: ${cat.total.toLocaleString()} VNĐ (${cat.count} giao dịch)`
).join('\n')}

=== THU NHẬP THEO DANH MỤC ===
${incomeByCategory.slice(0, 3).map((cat, index) => 
  `${index + 1}. ${cat.categoryName}: ${cat.total.toLocaleString()} VNĐ (${cat.count} giao dịch)`
).join('\n')}

=== TÌNH TRẠNG NGÂN SÁCH ===
${budgetData.length > 0 ? budgetData.map(budget => 
  `- ${budget.categoryName}: ${budget.spent.toLocaleString()}/${budget.limit.toLocaleString()} VNĐ (${budget.percentage}%) ${budget.isOverLimit ? '⚠️ VƯỢT QUÁ' : budget.isNearLimit ? '⚠️ GẦN GIỚI HẠN' : '✅ AN TOÀN'}`
).join('\n') : 'Chưa có ngân sách nào được thiết lập'}

=== CẢNH BÁO ===
${overBudgetCategories.length > 0 ? `- Vượt quá ngân sách: ${overBudgetCategories.map(c => c.categoryName).join(', ')}` : ''}
${nearBudgetCategories.length > 0 ? `- Gần đạt giới hạn: ${nearBudgetCategories.map(c => c.categoryName).join(', ')}` : ''}

=== XU HƯỚNG TÀI CHÍNH 12 THÁNG GẦN NHẤT ===
${financialData.monthlyTrends && financialData.monthlyTrends.length > 0 ? 
  financialData.monthlyTrends.map(trend => 
    `Tháng ${trend.thang}/${trend.nam}: Thu ${trend.thuNhap.toLocaleString()}VND, Chi ${trend.chiTieu.toLocaleString()}VND, Tiết kiệm ${trend.soTienTietKiem.toLocaleString()}VND, Số dư ${trend.soDuHienTai.toLocaleString()}VND`
  ).join('\n') : 
  'Chưa có dữ liệu xu hướng'
}

=== XU HƯỚNG CHI TIÊU 6 THÁNG GẦN NHẤT (TỪ GIAO DỊCH) ===
${spendingTrends.map(trend => 
  `Tháng ${trend.month}/${trend.year}: ${trend.total.toLocaleString()} VNĐ (${trend.count} giao dịch)`
).join('\n')}

=== GIAO DỊCH GẦN ĐÂY ===
${recentTransactions.slice(0, 10).map(transaction => 
  `${transaction.type === 'thu' ? '💰' : '💸'} ${transaction.amount.toLocaleString()} VNĐ - ${transaction.category} (${new Date(transaction.date).toLocaleDateString('vi-VN')}) ${transaction.note ? `- ${transaction.note}` : ''}`
).join('\n')}

=== DANH MỤC CÓ SẴN ===
${categoryDetails.map(cat => 
  `${cat.type === 'thu' ? '💰' : '💸'} ${cat.name}: ${cat.description || 'Không có mô tả'}`
).join('\n')}

Hãy phân tích dữ liệu này và đưa ra lời khuyên tài chính thông minh, cụ thể và hữu ích cho người dùng. Trả lời bằng tiếng Việt, thân thiện và dễ hiểu.
`;
  }

  // Xử lý câu hỏi của người dùng
  async processUserQuestion(userQuestion, financialData) {
    // Nếu Gemini API không khả dụng, throw error để sử dụng fallback
    if (!this.model) {
      throw new Error('Gemini API not available');
    }

    try {
      const context = this.createFinancialContext(financialData);
      
      const prompt = `${context}

=== CÂU HỎI CỦA NGƯỜI DÙNG ===
"${userQuestion}"

Hãy trả lời câu hỏi dựa trên dữ liệu tài chính ở trên. Nếu câu hỏi không liên quan đến tài chính, hãy lịch sự chuyển hướng về chủ đề tài chính cá nhân.

Yêu cầu:
1. Trả lời ngắn gọn, súc tích (tối đa 200 từ)
2. Sử dụng dữ liệu cụ thể từ phân tích
3. Đưa ra lời khuyên thực tế và khả thi
4. Sử dụng emoji phù hợp để làm cho câu trả lời sinh động
5. Nếu có thể, đưa ra con số cụ thể và phần trăm
6. Kết thúc bằng một câu hỏi gợi mở để khuyến khích tương tác tiếp

Trả lời:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error processing user question with Gemini:', error);
      throw new Error('Không thể xử lý câu hỏi. Vui lòng thử lại sau.');
    }
  }

  // Tạo gợi ý câu hỏi dựa trên dữ liệu tài chính
  async generateSuggestedQuestions(financialData) {
    try {
      const context = this.createFinancialContext(financialData);
      
      const prompt = `${context}

Dựa trên dữ liệu tài chính ở trên, hãy tạo ra 5 câu hỏi gợi ý mà người dùng có thể hỏi chatbot. Mỗi câu hỏi phải:
1. Liên quan trực tiếp đến dữ liệu tài chính của họ
2. Thú vị và hữu ích
3. Ngắn gọn (dưới 15 từ)
4. Đa dạng về chủ đề (phân tích, lời khuyên, so sánh, dự báo)

Trả lời theo format:
1. [Câu hỏi 1]
2. [Câu hỏi 2]
3. [Câu hỏi 3]
4. [Câu hỏi 4]
5. [Câu hỏi 5]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
     } catch (error) {
       console.error('Error generating suggested questions:', error);
       return `1. Tôi chi tiêu nhiều nhất ở đâu?
2. Tháng này tôi có tiết kiệm được không?
3. Tôi nên làm gì để quản lý tài chính tốt hơn?
4. Ngân sách của tôi có ổn không?
5. So với tháng trước, tài chính của tôi thế nào?`;
     }
  }

  // Format AI response into Markdown for better readability
  formatAIResponse(response) {
    // Example formatting: Add bold, italic, and newlines
    return response
      .replace(/\*\*(.*?)\*\*/g, '**$1**') // Keep existing bold
      .replace(/_(.*?)_/g, '_$1_') // Keep existing italic
      .replace(/\n/g, '\n') // Keep existing newlines
      .replace(/\s*([.!?])\s*/g, '$1\n') // Add newlines after sentences
      .replace(/\b(important|note|warning)\b/gi, '**$1**'); // Highlight keywords
  }
}

module.exports = GeminiService;
