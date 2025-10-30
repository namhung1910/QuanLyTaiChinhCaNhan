const express = require('express');
const tongQuanThangController = require('../controllers/tongQuanThangController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Middleware để bảo vệ tất cả các route
router.use(requireAuth);

// GET /api/tong-quan-thang - Lấy tất cả tổng quan tháng
router.get('/', tongQuanThangController.list);

// GET /api/tong-quan-thang/current - Lấy tổng quan tháng hiện tại
router.get('/current', tongQuanThangController.getCurrentMonth);

// GET /api/tong-quan-thang/trends - Lấy xu hướng các tháng gần đây
router.get('/trends', tongQuanThangController.getTrends);

// GET /api/tong-quan-thang/:thang/:nam - Lấy tổng quan tháng cụ thể
router.get('/:thang/:nam', tongQuanThangController.getByMonth);

// DELETE /api/tong-quan-thang/:id - Xóa tổng quan tháng
router.delete('/:id', tongQuanThangController.remove);

module.exports = router;
