const { body, validationResult } = require('express-validator');
const DanhMuc = require('../models/DanhMuc');

const validatorsCreate = [
  body('ten').notEmpty(),
  body('loai').isIn(['thu', 'chi']),
  body('moTa').optional(),
];

async function list(req, res) {
  try {
    const items = await DanhMuc.find({ nguoiDung: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error listing danh muc:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách danh mục', error: error.message });
  }
}

async function create(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { ten, loai, moTa } = req.body;
    const existed = await DanhMuc.findOne({ nguoiDung: req.user.id, ten, loai });
    if (existed) return res.status(409).json({ message: 'Danh mục đã tồn tại' });
    const item = await DanhMuc.create({ ten, loai, moTa, nguoiDung: req.user.id });
    res.json(item);
  } catch (error) {
    console.error('Error creating danh muc:', error);
    res.status(500).json({ message: 'Lỗi tạo danh mục', error: error.message });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { ten, loai, moTa } = req.body;
    const item = await DanhMuc.findOneAndUpdate(
      { _id: id, nguoiDung: req.user.id },
      { ten, loai, moTa },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(item);
  } catch (error) {
    console.error('Error updating danh muc:', error);
    res.status(500).json({ message: 'Lỗi cập nhật danh mục', error: error.message });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const r = await DanhMuc.findOneAndDelete({ _id: id, nguoiDung: req.user.id });
    if (!r) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error removing danh muc:', error);
    res.status(500).json({ message: 'Lỗi xóa danh mục', error: error.message });
  }
}

module.exports = { validatorsCreate, list, create, update, remove };


