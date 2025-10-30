const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NguoiDung = require('../models/NguoiDung');
const DanhMuc = require('../models/DanhMuc');

const validatorsDangKy = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('hoTen').notEmpty().withMessage('Vui lòng nhập họ tên'),
  body('matKhau').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
];

async function dangKy(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, matKhau, hoTen } = req.body;
  const existed = await NguoiDung.findOne({ email });
  if (existed) return res.status(409).json({ message: 'Email đã được sử dụng' });
  const matKhauHash = await bcrypt.hash(matKhau, 10);
  const user = await NguoiDung.create({ email, hoTen, matKhauHash });
  
  // Tạo danh mục mặc định cho người dùng mới
  const defaultCategories = [
    { ten: 'Lương', loai: 'thu', moTa: 'Lương cố định, thưởng' },
    { ten: 'Thu nhập phụ', loai: 'thu', moTa: 'Thu nhập từ công việc phụ, kinh doanh nhỏ' },
    { ten: 'Di chuyển', loai: 'chi', moTa: 'Xăng xe, taxi, vé xe buýt, vé máy bay' },
    { ten: 'Giải trí', loai: 'chi', moTa: 'Xem phim, chơi game, du lịch, sở thích' },
    { ten: 'Nhà ở', loai: 'chi', moTa: 'Tiền thuê nhà, điện nước, internet, bảo trì' },
    { ten: 'Y tế', loai: 'chi', moTa: 'Khám bệnh, thuốc men, bảo hiểm y tế' },
    { ten: 'Ăn uống', loai: 'chi', moTa: 'Mua thực phẩm, ăn uống ngoài, cà phê' }
  ];
  
  const categoriesWithUser = defaultCategories.map(cat => ({
    ...cat,
    nguoiDung: user._id
  }));
  
  await DanhMuc.insertMany(categoriesWithUser);
  
  res.json({ id: user._id, email: user.email, hoTen: user.hoTen });
}

const validatorsDangNhap = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('matKhau').notEmpty(),
];

async function dangNhap(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, matKhau } = req.body;
  const user = await NguoiDung.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
  const ok = await bcrypt.compare(matKhau, user.matKhauHash);
  if (!ok) return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, email: user.email, hoTen: user.hoTen } });
}

async function me(req, res) {
  const user = await NguoiDung.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  res.json({ id: user._id, email: user.email, hoTen: user.hoTen });
}

module.exports = { validatorsDangKy, validatorsDangNhap, dangKy, dangNhap, me };


