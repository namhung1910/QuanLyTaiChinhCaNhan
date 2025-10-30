const mongoose = require('mongoose');
const GiaoDich = require('../models/GiaoDich');
const DanhMuc = require('../models/DanhMuc');

// Ghi chú: Hàm này không được sử dụng trong các exports, nhưng vẫn có thể tối ưu bằng switch/case.
function getRange(theo, date) {
  const now = date ? new Date(date) : new Date();
  let start, end;
  switch (theo) {
    case 'ngay':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
      break;
    case 'tuan':
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      start = new Date(now);
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
      end.setHours(0, 0, 0, -1); // 23:59:59.999
      break;
    case 'nam':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default: // thang
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
  }
  return { start, end };
}

async function thongKe(req, res) {
  try {
    const { mode = 'thang', month, year } = req.query;
    const now = new Date();
    const y = Number(year) || now.getFullYear();
    const m = Number(month) || (now.getMonth() + 1);

    let start, end, seriesFormat, labels = [];

    // Đơn giản hóa logic xác định khoảng thời gian và nhãn (labels)
    switch (mode) {
      case 'tuan': {
        const base = new Date(y, m - 1, now.getDate());
        const day = base.getDay();
        const diffToMonday = (day + 6) % 7;
        start = new Date(base.setDate(base.getDate() - diffToMonday));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        seriesFormat = '%Y-%m-%d';
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          labels.push(d.toISOString().slice(0, 10));
        }
        break;
      }
      case 'nam': {
        start = new Date(y, 0, 1);
        end = new Date(y, 11, 31, 23, 59, 59, 999);
        seriesFormat = '%Y-%m';
        labels = Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`);
        break;
      }
      default: { // thang
        start = new Date(y, m - 1, 1);
        end = new Date(y, m, 0, 23, 59, 59, 999);
        seriesFormat = '%Y-%m-%d';
        const daysInMonth = end.getDate();
        labels = Array.from({ length: daysInMonth }, (_, i) => `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
        break;
      }
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const match = { nguoiDung: userId, ngay: { $gte: start, $lte: end } };

    // Tối ưu: Gộp 2 truy vấn aggregate thành 1 bằng $facet
    const [mainStats] = await GiaoDich.aggregate([
      { $match: match },
      {
        $facet: {
          byLoai: [
            { $group: { _id: '$loai', tong: { $sum: '$soTien' } } },
            { $sort: { _id: 1 } },
          ],
          rawSeries: [
            {
              $group: {
                _id: { $dateToString: { format: seriesFormat, date: '$ngay' } },
                tongThu: { $sum: { $cond: [{ $eq: ['$loai', 'thu'] }, '$soTien', 0] } },
                tongChi: { $sum: { $cond: [{ $eq: ['$loai', 'chi'] }, '$soTien', 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // Giữ nguyên logic tính topChi vì nó rõ ràng và hiệu quả
    const allDanhMucChi = await DanhMuc.find({ nguoiDung: userId, loai: 'chi', ten: { $ne: 'Lương' } });
    const chiTieuByDanhMuc = await GiaoDich.aggregate([
      { $match: { ...match, loai: 'chi' } },
      { $group: { _id: '$danhMuc', tong: { $sum: '$soTien' } } },
    ]);

    const chiTieuMap = new Map(chiTieuByDanhMuc.map(item => [item._id.toString(), item.tong]));

    const topChi = allDanhMucChi
      .map(danhMuc => ({
        _id: danhMuc._id,
        tong: chiTieuMap.get(danhMuc._id.toString()) || 0,
        danhMuc: danhMuc,
      }))
      .sort((a, b) => b.tong - a.tong);

    // Chuẩn hóa chuỗi thời gian
    const seriesMap = new Map(mainStats.rawSeries.map(s => [s._id, s]));
    let soDuTichLuy = 0;
    const timeSeries = labels.map(label => {
      const dataPoint = seriesMap.get(label) || { tongThu: 0, tongChi: 0 };
      soDuTichLuy += dataPoint.tongThu - dataPoint.tongChi;
      return { label, ...dataPoint, soDu: soDuTichLuy };
    });

    res.json({ byLoai: mainStats.byLoai, topChi, timeSeries, meta: { mode, month: m, year: y } });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu thống kê', error: error.message });
  }
}

async function getCurrentBalance(req, res) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Tối ưu: Tính tổng thu và chi trong cùng 1 query, không cần xử lý bằng JS
    const result = await GiaoDich.aggregate([
      { $match: { nguoiDung: userId } },
      {
        $group: {
          _id: null,
          tongThu: { $sum: { $cond: [{ $eq: ['$loai', 'thu'] }, '$soTien', 0] } },
          tongChi: { $sum: { $cond: [{ $eq: ['$loai', 'chi'] }, '$soTien', 0] } },
        },
      },
    ]);

    const stats = result[0] || { tongThu: 0, tongChi: 0 };
    const soDuHienTai = stats.tongThu - stats.tongChi;

    res.json({
      tongThu: stats.tongThu,
      tongChi: stats.tongChi,
      soDuHienTai,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin số dư', error: error.message });
  }
}

module.exports = { thongKe, getCurrentBalance };