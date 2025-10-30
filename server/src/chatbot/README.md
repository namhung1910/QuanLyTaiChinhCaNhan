# ChatBot - Trợ lý tài chính thông minh

## Tổng quan
ChatBot được xây dựng dựa trên Google Gemini AI để phân tích dữ liệu tài chính cá nhân và đưa ra lời khuyên thông minh.

## Cấu trúc thư mục
```
server/src/chatbot/
├── README.md
├── chatbotController.js      # Controller xử lý API requests
├── chatbotRoutes.js          # Routes cho chatbot endpoints
├── financialAnalysisService.js # Service phân tích dữ liệu tài chính
└── geminiService.js          # Service tích hợp Gemini AI
```

## API Endpoints

### POST /api/chatbot/message
Gửi tin nhắn cho chatbot
```json
{
  "message": "Tôi chi tiêu nhiều nhất ở đâu?"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Dựa trên dữ liệu của bạn...",
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

### GET /api/chatbot/suggestions
Lấy gợi ý câu hỏi dựa trên dữ liệu tài chính

**Response:**
```json
{
  "success": true,
  "suggestedQuestions": [
    "Tôi chi tiêu nhiều nhất ở đâu?",
    "Tháng này tôi có tiết kiệm được không?",
    "Tôi nên làm gì để quản lý tài chính tốt hơn?"
  ],
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

### GET /api/chatbot/summary
Lấy tóm tắt tài chính nhanh

**Response:**
```json
{
  "success": true,
  "summary": {
    "currentBalance": 11793000,
    "monthlyIncome": 7000000,
    "monthlyExpense": 2207000,
    "topExpenseCategory": "Ăn uống",
    "topExpenseAmount": 500000,
    "budgetAlerts": 2,
    "totalTransactions": 15
  },
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

## Tính năng

### 1. Phân tích dữ liệu tài chính
- Tổng quan tài chính toàn thời gian
- So sánh tháng hiện tại vs tháng trước
- Phân tích chi tiêu theo danh mục
- Phân tích thu nhập theo danh mục
- Tình trạng ngân sách và cảnh báo
- Xu hướng chi tiêu 6 tháng gần nhất

### 2. AI Chat thông minh
- Trả lời câu hỏi dựa trên dữ liệu thực tế
- Đưa ra lời khuyên tài chính cụ thể
- Gợi ý câu hỏi phù hợp với tình hình tài chính
- Tóm tắt nhanh tình hình tài chính

### 3. Frontend Widget
- Chat widget luôn hiển thị trên mọi trang (trừ auth)
- Giao diện thân thiện và responsive
- Gợi ý câu hỏi thông minh
- Hiển thị tóm tắt tài chính nhanh

## Cài đặt

### 1. Cài đặt dependencies
```bash
npm install @google/generative-ai
```

### 2. Cấu hình environment variables
Thêm vào file `.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Lấy Gemini API Key
1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API key mới
3. Copy và paste vào file `.env`

## Sử dụng

### Backend
ChatBot sẽ tự động phân tích dữ liệu tài chính của người dùng khi họ gửi tin nhắn.

### Frontend
Chat widget sẽ xuất hiện ở góc dưới bên phải màn hình. Click vào icon để mở chat.

## Bảo mật
- Tất cả API endpoints đều yêu cầu authentication
- Dữ liệu tài chính chỉ được truy cập bởi chính người dùng đó
- Không lưu trữ lịch sử chat (có thể implement sau)

## Mở rộng
- Thêm lưu trữ lịch sử chat
- Thêm phân tích dự báo tài chính
- Thêm cảnh báo thông minh
- Thêm tích hợp với các dịch vụ tài chính khác
