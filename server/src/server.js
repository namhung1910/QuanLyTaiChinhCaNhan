const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const danhMucRoutes = require('./routes/danhmuc');
const giaoDichRoutes = require('./routes/giaodich');
const nganSachRoutes = require('./routes/ngansach');
const baoCaoRoutes = require('./routes/baocao');
const tongQuanThangRoutes = require('./routes/tongQuanThangRoutes');
const lichSuChatRoutes = require('./routes/lichSuChatRoutes');
const chatbotRoutes = require('./chatbot/chatbotRoutes');

const app = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/danh-muc', danhMucRoutes);
app.use('/api/giao-dich', giaoDichRoutes);
app.use('/api/ngan-sach', nganSachRoutes);
app.use('/api/bao-cao', baoCaoRoutes);
app.use('/api/tong-quan-thang', tongQuanThangRoutes);
app.use('/api/lich-su-chat', lichSuChatRoutes);
app.use('/api/chatbot', chatbotRoutes);

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Lỗi hệ thống' });
});

module.exports = app;


