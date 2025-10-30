const mongoose = require('mongoose');

const TongQuanThangSchema = new mongoose.Schema(
  {
    thang: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 12 
    },
    nam: { 
      type: Number, 
      required: true 
    },
    thuNhap: { 
      type: Number, 
      default: 0,
      min: 0
    },
    chiTieu: { 
      type: Number, 
      default: 0,
      min: 0
    },
    soTienTietKiem: { 
      type: Number, 
      default: 0
    },
    soDuHienTai: { 
      type: Number, 
      default: 0
    },
    nguoiDung: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'NguoiDung', 
      required: true 
    }
  },
  { 
    timestamps: true, 
    collection: 'TongQuanThang' 
  }
);

// Index để đảm bảo mỗi người dùng chỉ có 1 record cho mỗi tháng/năm
TongQuanThangSchema.index({ nguoiDung: 1, thang: 1, nam: 1 }, { unique: true });

// Virtual để tính toán soTienTietKiem tự động
TongQuanThangSchema.virtual('tietKiem').get(function() {
  return this.thuNhap - this.chiTieu;
});

// Pre-save middleware để tự động tính soTienTietKiem
TongQuanThangSchema.pre('save', function(next) {
  this.soTienTietKiem = this.thuNhap - this.chiTieu;
  next();
});

module.exports = mongoose.model('TongQuanThang', TongQuanThangSchema);
