const http = require('http');
const app = require('./server');
const { connectDatabase } = require('./lib/db');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDatabase();
  // Đồng bộ indexes (đảm bảo sparse index trên tenDangNhap được áp dụng)
  try {
    const NguoiDung = require('./models/NguoiDung');
    await NguoiDung.syncIndexes();
  } catch (e) {
    console.warn('Không thể sync indexes NguoiDung:', e.message);
  }
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`API is running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


