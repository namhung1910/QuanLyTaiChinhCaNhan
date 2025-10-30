const TongQuanThang = require('../models/TongQuanThang');
const GiaoDich = require('../models/GiaoDich');
const mongoose = require('mongoose'); // Cần mongoose để dùng ObjectId

// --- HELPER FUNCTIONS (Đã sửa lỗi và tối ưu đúng) ---

/**
 * Tính toán và cập nhật tổng quan cho một tháng cụ thể.
 * @param {string} userId - ID người dùng
 * @param {number} thang - Tháng (1-12)
 * @param {number} nam - Năm
 * @returns {Promise<Document>} - Document TongQuanThang đã được cập nhật.
 */
async function tinhToanVaCapNhatThang(userId, thang, nam) {
    const firstDay = new Date(nam, thang - 1, 1);
    const lastDay = new Date(nam, thang, 0, 23, 59, 59, 999);
    const nguoiDungId = new mongoose.Types.ObjectId(String(userId));

    // 1. Dùng Aggregation để tính tổng thu/chi trong tháng (vẫn rất hiệu quả)
    const monthlyAgg = await GiaoDich.aggregate([
        { $match: { nguoiDung: nguoiDungId, ngay: { $gte: firstDay, $lte: lastDay } } },
        {
            $group: {
                _id: null,
                thuNhap: { $sum: { $cond: [{ $eq: ['$loai', 'thu'] }, '$soTien', 0] } },
                chiTieu: { $sum: { $cond: [{ $eq: ['$loai', 'chi'] }, '$soTien', 0] } }
            }
        }
    ]);
    
    const { thuNhap = 0, chiTieu = 0 } = monthlyAgg[0] || {};
    const soTienTietKiem = thuNhap - chiTieu;

    // 2. [SỬA LỖI] Tính Số Dư Hiện Tại một cách chính xác và hiệu quả.
    // Lấy tổng thu và tổng chi của TẤT CẢ các giao dịch TRƯỚC tháng này.
    const balanceAgg = await GiaoDich.aggregate([
        { $match: { nguoiDung: nguoiDungId, ngay: { $lt: firstDay } } },
        {
            $group: {
                _id: null,
                totalThu: { $sum: { $cond: [{ $eq: ['$loai', 'thu'] }, '$soTien', 0] } },
                totalChi: { $sum: { $cond: [{ $eq: ['$loai', 'chi'] }, '$soTien', 0] } }
            }
        }
    ]);

    const soDuDauKy = (balanceAgg[0]?.totalThu || 0) - (balanceAgg[0]?.totalChi || 0);
    const soDuHienTai = soDuDauKy + soTienTietKiem;

    // 3. Dùng findOneAndUpdate với upsert:true để tạo hoặc cập nhật trong 1 lệnh
    return TongQuanThang.findOneAndUpdate(
        { nguoiDung: userId, thang, nam },
        { thuNhap, chiTieu, soTienTietKiem, soDuHienTai },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}

/**
 * Tìm hoặc tạo và trả về tổng quan tháng.
 * @param {string} userId
 * @param {number} thang
 * @param {number} nam
 * @returns {Promise<Document>}
 */
async function findOrCreateMonthSummary(userId, thang, nam) {
    const summary = await TongQuanThang.findOne({ nguoiDung: userId, thang, nam });
    // Nếu đã có và không có giao dịch mới nào trong tháng, trả về ngay.
    // Nếu chưa có, hoặc có thể đã cũ, tính toán lại để đảm bảo dữ liệu mới nhất.
    return tinhToanVaCapNhatThang(userId, thang, nam);
}


// --- CONTROLLER FUNCTIONS (Giữ nguyên, không cần sửa) ---

async function list(req, res) {
    try {
        const items = await TongQuanThang.find({ nguoiDung: req.user.id }).sort({ nam: -1, thang: -1 });
        res.json(items);
    } catch (error) {
        console.error('Lỗi lấy danh sách tổng quan tháng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function getCurrentMonth(req, res) {
    try {
        const now = new Date();
        // Luôn chạy hàm tính toán để đảm bảo dữ liệu là mới nhất khi user vào xem
        const tongQuanThang = await tinhToanVaCapNhatThang(req.user.id, now.getMonth() + 1, now.getFullYear());
        res.json(tongQuanThang);
    } catch (error) {
        console.error('Lỗi lấy tổng quan tháng hiện tại:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function getByMonth(req, res) {
    try {
        const thang = parseInt(req.params.thang);
        const nam = parseInt(req.params.nam);
        // Tương tự, luôn tính toán lại để đảm bảo tính chính xác
        const tongQuanThang = await tinhToanVaCapNhatThang(req.user.id, thang, nam);
        res.json(tongQuanThang);
    } catch (error) {
        console.error('Lỗi lấy tổng quan tháng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function getTrends(req, res) {
    try {
        const { months = 6 } = req.query;
        const data = await TongQuanThang.find({ nguoiDung: req.user.id })
            .sort({ nam: -1, thang: -1 })
            .limit(parseInt(months));

        const calculateTrend = (values) => {
            if (values.length < 2) return { direction: 'stable', percentage: 0 };
            const [latest, previous] = values;
            if (previous === 0) return latest > 0 ? { direction: 'up', percentage: 100 } : { direction: 'stable', percentage: 0 };
            const percentage = ((latest - previous) / previous) * 100;
            const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable';
            return { direction, percentage: Math.abs(percentage) };
        };

        const trends = {
            thuNhap: calculateTrend(data.map(item => item.thuNhap)),
            chiTieu: calculateTrend(data.map(item => item.chiTieu)),
            tietKiem: calculateTrend(data.map(item => item.soTienTietKiem)),
        };

        res.json({ data, trends });
    } catch (error) {
        console.error('Lỗi lấy xu hướng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function remove(req, res) {
    try {
        const { id } = req.params;
        const item = await TongQuanThang.findOneAndDelete({ _id: id, nguoiDung: req.user.id });
        if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        console.error('Lỗi xóa tổng quan tháng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}


// --- EXPORTED FUNCTIONS (dùng cho controller khác) ---

async function updateOnTransactionChange(userId, giaoDich) {
    try {
        const ngay = new Date(giaoDich.ngay);
        const thangBatDau = ngay.getMonth() + 1;
        const namBatDau = ngay.getFullYear();

        // Lấy danh sách tất cả các tháng bị ảnh hưởng (từ tháng của giao dịch trở về sau)
        const futureMonths = await TongQuanThang.find({
            nguoiDung: userId,
            $or: [
                { nam: { $gt: namBatDau } },
                { nam: namBatDau, thang: { $gte: thangBatDau } }
            ]
        }).sort({ nam: 1, thang: 1 });

        // Luôn tính toán lại tháng hiện tại của giao dịch
        await tinhToanVaCapNhatThang(userId, thangBatDau, namBatDau);
        
        // Tính toán lại các tháng tiếp theo nếu chúng tồn tại
        for (const month of futureMonths) {
            // Không cần tính lại tháng đầu tiên một lần nữa
            if(month.thang === thangBatDau && month.nam === namBatDau) continue;
            await tinhToanVaCapNhatThang(userId, month.thang, month.nam);
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật chuỗi tổng quan tháng:', error);
        throw error;
    }
}

module.exports = {
    list,
    getCurrentMonth,
    getByMonth,
    getTrends,
    updateOnTransactionChange,
    remove
};