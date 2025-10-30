const mongoose = require('mongoose');

const LichSuChatSchema = new mongoose.Schema(
  {
    nguoiDung: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'NguoiDung', 
      required: true 
    },
    messages: [{
      id: { type: String, required: true },
      type: { type: String, enum: ['user', 'bot'], required: true },
      content: { type: String, required: true },
      timestamp: { type: String, required: true }
    }],
    lastMessageAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    timestamps: true, 
    collection: 'LichSuChat' 
  }
);

// Index để tối ưu truy vấn - chỉ có 1 bản ghi cho mỗi người dùng
LichSuChatSchema.index({ nguoiDung: 1 }, { unique: true });
LichSuChatSchema.index({ lastMessageAt: 1 }); // Để cleanup dễ dàng

// Pre-save middleware để cập nhật lastMessageAt
LichSuChatSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    const lastMessage = this.messages[this.messages.length - 1];
    this.lastMessageAt = new Date(lastMessage.timestamp);
  }
  next();
});

// Method để thêm message mới
LichSuChatSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.lastMessageAt = new Date(message.timestamp);
  return this.save();
};

// Method để lấy messages gần đây (giới hạn để tránh quá tải)
LichSuChatSchema.methods.getRecentMessages = function(limit = 50) {
  return this.messages.slice(-limit);
};

module.exports = mongoose.model('LichSuChat', LichSuChatSchema);
