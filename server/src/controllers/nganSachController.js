const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const NganSach = require('../models/NganSach');
const GiaoDich = require('../models/GiaoDich');

// --- Validators không thay đổi ---
const validatorsCreate = [
    body('danhMuc').notEmpty(),
    body('soTienGioiHan').isFloat({ gt: 0 }),
    body('kyHan').isIn(['thang', 'tuan', 'nam']).optional(),
    body('thang').optional().isInt({ min: 1, max: 12 }),
    body('nam').optional().isInt({ min: 2000 }),
];

// --- HELPER FUNCTIONS ---

/**
 * Tính toán khoảng thời gian (start, end) dựa trên kỳ hạn của ngân sách.
 * @param {object} budget - Document ngân sách.
 * @returns {{start: Date, end: Date}}
 */
function getKyHanDateRange(budget) {
    const now = new Date();
    let start, end;

    switch (budget.kyHan) {
        case 'tuan':
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            start = new Date(now);
            start.setDate(now.getDate() - diffToMonday);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 7);
            end.setHours(23, 59, 59, 999);
            break;
        case 'nam':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        default: // 'thang'
            const thang = budget.thang || (now.getMonth() + 1);
            const nam = budget.nam || now.getFullYear();
            start = new Date(nam, thang - 1, 1);
            end = new Date(nam, thang, 0, 23, 59, 59, 999);
            break;
    }
    return { start, end };
}

/**
 * Tính tổng chi tiêu trong kỳ cho một ngân sách.
 * @param {object} budget - Document ngân sách.
 * @returns {Promise<number>} - Tổng số tiền đã chi.
 */
async function tinhChiTieuTrongKy(budget) {
    const { start, end } = getKyHanDateRange(budget);
    
    // Đảm bảo ID luôn là ObjectId để match
    const nguoiDungId = new mongoose.Types.ObjectId(String(budget.nguoiDung._id || budget.nguoiDung));
    const danhMucId = new mongoose.Types.ObjectId(String(budget.danhMuc._id || budget.danhMuc));

    const result = await GiaoDich.aggregate([
        {
            $match: {
                nguoiDung: nguoiDungId,
                danhMuc: danhMucId,
                loai: 'chi',
                ngay: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: null,
                tong: { $sum: '$soTien' }
            }
        }
    ]);
    return result[0]?.tong || 0;
}

/**
 * Bổ sung thông tin 'daChi' và 'tiLe' vào một document ngân sách.
 * @param {object} budget - Document ngân sách.
 * @returns {Promise<object>} - Object ngân sách đã có thêm thông tin chi tiêu.
 */
async function formatBudgetResponse(budget) {
    const daChi = await tinhChiTieuTrongKy(budget);
    const tiLe = budget.soTienGioiHan > 0 ? daChi / budget.soTienGioiHan : 0;
    return { ...budget.toObject(), daChi, tiLe };
}

/**
 * Kiểm tra ngân sách trùng lặp.
 * @param {string} userId - ID người dùng.
 * @param {object} data - Dữ liệu ngân sách (chứa danhMuc, kyHan).
 * @param {string|null} excludeId - ID ngân sách cần loại trừ khi kiểm tra (dùng cho update).
 * @returns {Promise<Document|null>} - Document ngân sách nếu trùng, ngược lại là null.
 */
async function checkDuplicateBudget(userId, data, excludeId = null) {
    const query = {
        nguoiDung: userId,
        danhMuc: data.danhMuc,
        kyHan: data.kyHan,
    };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    return NganSach.findOne(query);
}

// --- CONTROLLER FUNCTIONS ---

async function list(req, res) {
    try {
        const items = await NganSach.find({ nguoiDung: req.user.id }).populate('danhMuc').sort({ createdAt: -1 });
        // NOTE: Vòng lặp Promise.all có thể gây ra vấn đề N+1 query nếu có nhiều ngân sách.
        // Đây là điểm có thể tối ưu sâu hơn trong tương lai nếu hiệu năng bị ảnh hưởng.
        const withSpend = await Promise.all(items.map(formatBudgetResponse));
        res.json(withSpend);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const data = { ...req.body, nguoiDung: req.user.id };
        const existing = await checkDuplicateBudget(req.user.id, data);
        if (existing) {
            return res.status(409).json({ message: `Đã tồn tại ngân sách cho danh mục và kỳ hạn này.` });
        }

        const item = await NganSach.create(data);
        const responseData = await formatBudgetResponse(item);
        res.status(201).json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function update(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;

        const existing = await checkDuplicateBudget(req.user.id, data, id);
        if (existing) {
            return res.status(409).json({ message: `Đã tồn tại ngân sách cho danh mục và kỳ hạn này.` });
        }

        const item = await NganSach.findOneAndUpdate({ _id: id, nguoiDung: req.user.id }, data, { new: true });
        if (!item) return res.status(404).json({ message: 'Không tìm thấy' });

        const responseData = await formatBudgetResponse(item);
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function remove(req, res) {
    try {
        const { id } = req.params;
        const r = await NganSach.findOneAndDelete({ _id: id, nguoiDung: req.user.id });
        if (!r) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function canhBao(req, res) {
    try {
        const items = await NganSach.find({ nguoiDung: req.user.id }).populate('danhMuc');
        const warnings = [];
        for (const budget of items) {
            const daChi = await tinhChiTieuTrongKy(budget);
            const tiLe = budget.soTienGioiHan > 0 ? daChi / budget.soTienGioiHan : 0;
            if (tiLe >= 0.8) {
                warnings.push({ ...budget.toObject(), daChi, tiLe });
            }
        }
        res.json(warnings);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

module.exports = { validatorsCreate, list, create, update, remove, canhBao };