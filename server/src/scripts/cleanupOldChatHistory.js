const mongoose = require('mongoose');
require('dotenv').config();

const LichSuChat = require('../models/LichSuChat');

async function cleanupOldChatHistory() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quanlytaichincanhan');
    console.log('✅ Connected to MongoDB');

    // Tính ngày 1 năm trước
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    console.log(`🗑️ Cleaning up chat history older than: ${oneYearAgo.toISOString()}`);

    // Tìm và xóa các chat history cũ hơn 1 năm
    const result = await LichSuChat.deleteMany({
      lastMessageAt: { $lt: oneYearAgo }
    });

    console.log(`✅ Cleanup completed!`);
    console.log(`📊 Deleted ${result.deletedCount} old chat history records`);

    // Thống kê còn lại
    const remainingCount = await LichSuChat.countDocuments();
    const activeCount = await LichSuChat.countDocuments({ isActive: true });
    
    console.log(`📈 Remaining chat history records: ${remainingCount}`);
    console.log(`🟢 Active chat sessions: ${activeCount}`);

    // Thống kê theo thời gian
    const stats = await LichSuChat.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$lastMessageAt' },
            month: { $month: '$lastMessageAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    console.log('\n📅 Chat history by month (last 12 months):');
    stats.forEach(stat => {
      console.log(`  ${stat._id.year}-${String(stat._id.month).padStart(2, '0')}: ${stat.count} records`);
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Chạy cleanup
if (require.main === module) {
  cleanupOldChatHistory();
}

module.exports = cleanupOldChatHistory;
