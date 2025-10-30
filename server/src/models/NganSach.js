const mongoose = require('mongoose');

const NganSachSchema = new mongoose.Schema(
  {
    danhMuc: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', required: true },
    soTienGioiHan: { type: Number, required: true },
    kyHan: { type: String, enum: ['thang', 'tuan', 'nam'], default: 'thang' },
    thang: { type: Number },
    nam: { type: Number },
    nguoiDung: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', index: true },
  },
  { timestamps: true, collection: 'NganSach' }
);

module.exports = mongoose.model('NganSach', NganSachSchema);


