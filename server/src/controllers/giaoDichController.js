const { body, validationResult } = require('express-validator');
const GiaoDich = require('../models/GiaoDich');
const tongQuanThangController = require('./tongQuanThangController');

// --- Validators không thay đổi ---
const validatorsCreate = [
    body('soTien').isFloat({ gt: 0 }),
    body('loai').isIn(['thu', 'chi']),
    body('danhMuc').notEmpty(),
    body('ngay').notEmpty(),
];

// --- Helper function để tránh lặp code ---
// Hàm này sẽ đảm nhận việc cập nhật TongQuanThang và tự xử lý lỗi
async function updateTongQuanThang(userId, transaction) {
    if (!transaction) return;
    try {
        await tongQuanThangController.updateOnTransactionChange(userId, transaction);
    } catch (error) {
        // Ghi log lỗi nhưng không làm gián đoạn flow chính
        console.error(`Lỗi khi cập nhật TongQuanThang cho giao dịch ${transaction._id}:`, error);
    }
}

// --- Các hàm xử lý request ---
async function list(req, res) {
    try {
        const { loai, danhMuc, tuNgay, denNgay, min, max, the, q } = req.query;
        const filter = { nguoiDung: req.user.id };

        if (loai) filter.loai = loai;
        if (danhMuc) filter.danhMuc = danhMuc;
        if (the) filter.the = { $in: the.split(',') };
        if (q) filter.ghiChu = { $regex: q, $options: 'i' };

        if (tuNgay || denNgay) {
            filter.ngay = {};
            if (tuNgay) filter.ngay.$gte = new Date(tuNgay);
            if (denNgay) filter.ngay.$lte = new Date(denNgay);
        }

        if (min || max) {
            filter.soTien = {};
            if (min) filter.soTien.$gte = Number(min);
            if (max) filter.soTien.$lte = Number(max);
        }

        const items = await GiaoDich.find(filter).populate('danhMuc').sort({ ngay: -1, createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Lỗi lấy danh sách giao dịch:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { ngay } = req.body;
        // Chuẩn hóa ngày: nếu không có hoặc không hợp lệ, dùng ngày hiện tại.
        const ngayDate = new Date(ngay);
        const finalNgay = isNaN(ngayDate.getTime()) ? new Date() : ngayDate;
        
        const item = await GiaoDich.create({
            ...req.body,
            ngay: finalNgay,
            nguoiDung: req.user.id
        });

        await updateTongQuanThang(req.user.id, item); // Gọi helper

        res.status(201).json(item); // Dùng status 201 cho việc tạo mới
    } catch (error) {
        console.error('Lỗi tạo giao dịch:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function update(req, res) {
    try {
        const item = await GiaoDich.findOneAndUpdate(
            { _id: req.params.id, nguoiDung: req.user.id },
            req.body,
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        }

        await updateTongQuanThang(req.user.id, item); // Gọi helper

        res.json(item);
    } catch (error) {
        console.error('Lỗi cập nhật giao dịch:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

async function remove(req, res) {
    try {
        const item = await GiaoDich.findOneAndDelete({ _id: req.params.id, nguoiDung: req.user.id });

        if (!item) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        }

        await updateTongQuanThang(req.user.id, item); // Gọi helper

        res.json({ ok: true });
    } catch (error) {
        console.error('Lỗi xóa giao dịch:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
}

module.exports = { validatorsCreate, list, create, update, remove };