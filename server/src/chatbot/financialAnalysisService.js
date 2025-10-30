const mongoose = require('mongoose');
const GiaoDich = require('../models/GiaoDich');
const DanhMuc = require('../models/DanhMuc');
const NganSach = require('../models/NganSach');
const TongQuanThang = require('../models/TongQuanThang');

class FinancialAnalysisService {
  constructor(userId) {
    this.userId = new mongoose.Types.ObjectId(userId);
  }

  // Lấy tổng quan tài chính toàn thời gian
  async getOverallFinancialSummary() {
    try {
      const result = await GiaoDich.aggregate([
        { $match: { nguoiDung: this.userId } },
        {
          $group: {
            _id: '$loai',
            total: { $sum: '$soTien' },
            count: { $sum: 1 }
          }
        }
      ]);

      let totalIncome = 0;
      let totalExpense = 0;
      let incomeCount = 0;
      let expenseCount = 0;

      result.forEach(item => {
        if (item._id === 'thu') {
          totalIncome = item.total;
          incomeCount = item.count;
        } else if (item._id === 'chi') {
          totalExpense = item.total;
          expenseCount = item.count;
        }
      });

      const currentBalance = totalIncome - totalExpense;

      return {
        totalIncome,
        totalExpense,
        currentBalance,
        incomeCount,
        expenseCount,
        totalTransactions: incomeCount + expenseCount
      };
    } catch (error) {
      console.error('Error getting overall financial summary:', error);
      throw error;
    }
  }

  // Lấy dữ liệu tháng hiện tại
  async getCurrentMonthData() {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const result = await GiaoDich.aggregate([
        { 
          $match: { 
            nguoiDung: this.userId,
            ngay: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
          } 
        },
        {
          $group: {
            _id: '$loai',
            total: { $sum: '$soTien' },
            count: { $sum: 1 }
          }
        }
      ]);

      let monthlyIncome = 0;
      let monthlyExpense = 0;
      let monthlyIncomeCount = 0;
      let monthlyExpenseCount = 0;

      result.forEach(item => {
        if (item._id === 'thu') {
          monthlyIncome = item.total;
          monthlyIncomeCount = item.count;
        } else if (item._id === 'chi') {
          monthlyExpense = item.total;
          monthlyExpenseCount = item.count;
        }
      });

      return {
        monthlyIncome,
        monthlyExpense,
        monthlyIncomeCount,
        monthlyExpenseCount,
        monthlyTransactions: monthlyIncomeCount + monthlyExpenseCount
      };
    } catch (error) {
      console.error('Error getting current month data:', error);
      throw error;
    }
  }

  // Lấy dữ liệu tháng trước để so sánh
  async getPreviousMonthData() {
    try {
      const now = new Date();
      const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      const result = await GiaoDich.aggregate([
        { 
          $match: { 
            nguoiDung: this.userId,
            ngay: { $gte: firstDayOfPrevMonth, $lte: lastDayOfPrevMonth }
          } 
        },
        {
          $group: {
            _id: '$loai',
            total: { $sum: '$soTien' },
            count: { $sum: 1 }
          }
        }
      ]);

      let prevMonthlyIncome = 0;
      let prevMonthlyExpense = 0;

      result.forEach(item => {
        if (item._id === 'thu') {
          prevMonthlyIncome = item.total;
        } else if (item._id === 'chi') {
          prevMonthlyExpense = item.total;
        }
      });

      return {
        prevMonthlyIncome,
        prevMonthlyExpense
      };
    } catch (error) {
      console.error('Error getting previous month data:', error);
      throw error;
    }
  }

  // Phân tích chi tiêu theo danh mục
  async getExpenseByCategory() {
    try {
      const result = await GiaoDich.aggregate([
        { 
          $match: { 
            nguoiDung: this.userId,
            loai: 'chi'
          } 
        },
        {
          $group: {
            _id: '$danhMuc',
            total: { $sum: '$soTien' },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'DanhMuc',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { total: -1 }
        }
      ]);

      return result.map(item => ({
        categoryName: item.category ? item.category.ten : 'Danh mục không xác định',
        total: item.total,
        count: item.count,
        categoryId: item._id
      }));
    } catch (error) {
      console.error('Error getting expense by category:', error);
      throw error;
    }
  }

  // Phân tích thu nhập theo danh mục
  async getIncomeByCategory() {
    try {
      const result = await GiaoDich.aggregate([
        { 
          $match: { 
            nguoiDung: this.userId,
            loai: 'thu'
          } 
        },
        {
          $group: {
            _id: '$danhMuc',
            total: { $sum: '$soTien' },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'DanhMuc',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { total: -1 }
        }
      ]);

      return result.map(item => ({
        categoryName: item.category ? item.category.ten : 'Danh mục không xác định',
        total: item.total,
        count: item.count,
        categoryId: item._id
      }));
    } catch (error) {
      console.error('Error getting income by category:', error);
      throw error;
    }
  }

  // Lấy dữ liệu ngân sách và cảnh báo
  async getBudgetData() {
    try {
      const budgets = await NganSach.find({ nguoiDung: this.userId }).populate('danhMuc');
      
      const budgetAnalysis = await Promise.all(budgets.map(async (budget) => {
        // Tính chi tiêu trong kỳ hiện tại
        const now = new Date();
        let startDate, endDate;
        
        if (budget.kyHan === 'tuan') {
          const day = now.getDay();
          const diffToMonday = (day + 6) % 7;
          startDate = new Date(now);
          startDate.setDate(now.getDate() - diffToMonday);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          endDate.setHours(23, 59, 59, 999);
        } else if (budget.kyHan === 'nam') {
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else { // thang
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const spent = await GiaoDich.aggregate([
          {
            $match: {
              nguoiDung: this.userId,
              danhMuc: budget.danhMuc._id,
              loai: 'chi',
              ngay: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$soTien' }
            }
          }
        ]);

        const spentAmount = spent.length > 0 ? spent[0].total : 0;
        const percentage = budget.soTienGioiHan > 0 ? (spentAmount / budget.soTienGioiHan) * 100 : 0;

        return {
          categoryName: budget.danhMuc.ten,
          limit: budget.soTienGioiHan,
          spent: spentAmount,
          remaining: budget.soTienGioiHan - spentAmount,
          percentage: Math.round(percentage),
          period: budget.kyHan,
          isOverLimit: percentage > 100,
          isNearLimit: percentage > 80 && percentage <= 100
        };
      }));

      return budgetAnalysis;
    } catch (error) {
      console.error('Error getting budget data:', error);
      throw error;
    }
  }

  // Lấy xu hướng chi tiêu theo tháng (6 tháng gần nhất)
  async getSpendingTrends() {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      
      const result = await GiaoDich.aggregate([
        {
          $match: {
            nguoiDung: this.userId,
            loai: 'chi',
            ngay: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$ngay' },
              month: { $month: '$ngay' }
            },
            total: { $sum: '$soTien' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      return result.map(item => ({
        year: item._id.year,
        month: item._id.month,
        total: item.total,
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting spending trends:', error);
      throw error;
    }
  }

  // Lấy thông tin chi tiết giao dịch gần đây
  async getRecentTransactions(limit = 10) {
    try {
      const transactions = await GiaoDich.find({ nguoiDung: this.userId })
        .populate({
          path: 'danhMuc',
          select: 'ten loai',
          options: { strictPopulate: false }
        })
        .sort({ ngay: -1, createdAt: -1 })
        .limit(limit);

      return transactions.map(transaction => ({
        id: transaction._id,
        amount: transaction.soTien,
        type: transaction.loai,
        category: transaction.danhMuc ? transaction.danhMuc.ten : 'Không có danh mục',
        categoryType: transaction.danhMuc ? transaction.danhMuc.loai : null,
        date: transaction.ngay,
        note: transaction.ghiChu || '',
        tags: transaction.the || []
      }));
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      throw error;
    }
  }

  // Lấy thông tin danh mục chi tiết
  async getCategoryDetails() {
    try {
      const categories = await DanhMuc.find({ nguoiDung: this.userId }).sort({ createdAt: -1 });
      
      return categories.map(category => ({
        id: category._id,
        name: category.ten,
        type: category.loai,
        description: category.moTa || '',
        createdAt: category.createdAt
      }));
    } catch (error) {
      console.error('Error getting category details:', error);
      throw error;
    }
  }

  // Lấy dữ liệu xu hướng từ TongQuanThang
  async getMonthlyTrends() {
    try {
      const trends = await TongQuanThang.find({ nguoiDung: this.userId })
        .sort({ nam: -1, thang: -1 })
        .limit(12); // 12 tháng gần nhất

      return trends.map(item => ({
        thang: item.thang,
        nam: item.nam,
        thuNhap: item.thuNhap,
        chiTieu: item.chiTieu,
        soTienTietKiem: item.soTienTietKiem,
        soDuHienTai: item.soDuHienTai
      }));
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      throw error;
    }
  }

  // Tổng hợp tất cả dữ liệu cho chatbot
  async getAllFinancialData() {
    try {
      const [
        overallSummary,
        currentMonthData,
        previousMonthData,
        expenseByCategory,
        incomeByCategory,
        budgetData,
        spendingTrends,
        recentTransactions,
        categoryDetails,
        monthlyTrends
      ] = await Promise.all([
        this.getOverallFinancialSummary(),
        this.getCurrentMonthData(),
        this.getPreviousMonthData(),
        this.getExpenseByCategory(),
        this.getIncomeByCategory(),
        this.getBudgetData(),
        this.getSpendingTrends(),
        this.getRecentTransactions(15),
        this.getCategoryDetails(),
        this.getMonthlyTrends()
      ]);

      return {
        overall: overallSummary,
        currentMonth: currentMonthData,
        previousMonth: previousMonthData,
        expenseByCategory,
        incomeByCategory,
        budgetData,
        spendingTrends,
        recentTransactions,
        categoryDetails,
        monthlyTrends,
        analysisDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting all financial data:', error);
      throw error;
    }
  }
}

module.exports = FinancialAnalysisService;
