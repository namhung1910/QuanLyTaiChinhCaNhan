const mongoose = require('mongoose');

const GiaoDichSchema = new mongoose.Schema(
  {
    soTien: { type: Number, required: true },
    loai: { type: String, enum: ['thu', 'chi'], required: true },
    danhMuc: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', required: true },
    ngay: { type: Date, required: true },
    ghiChu: { type: String },
    the: { type: [String], default: [] },
    nguoiDung: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', index: true },
  },
  { timestamps: true, collection: 'GiaoDich' }
);

module.exports = mongoose.model('GiaoDich', GiaoDichSchema);


