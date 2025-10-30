const mongoose = require('mongoose');

const DanhMucSchema = new mongoose.Schema(
  {
    ten: { type: String, required: true },
    loai: { type: String, enum: ['thu', 'chi'], required: true },
    moTa: { type: String },
    nguoiDung: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', index: true },
  },
  { timestamps: true, collection: 'DanhMuc' }
);

module.exports = mongoose.model('DanhMuc', DanhMucSchema);


