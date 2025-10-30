const mongoose = require('mongoose');

const NguoiDungSchema = new mongoose.Schema(
  {
    hoTen: { type: String },
    email: { type: String, unique: true, required: true },
    soDienThoai: { type: String, index: true },
    // tenDangNhap giữ lại để tương thích dữ liệu cũ, không còn bắt buộc
    tenDangNhap: { type: String },
    matKhauHash: { type: String, required: true },
  },
  { timestamps: true, collection: 'NguoiDung' }
);

// Bảo đảm index đúng: email unique; tenDangNhap unique nhưng sparse để cho phép null/undefined
NguoiDungSchema.index({ email: 1 }, { unique: true });
NguoiDungSchema.index({ tenDangNhap: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('NguoiDung', NguoiDungSchema);


