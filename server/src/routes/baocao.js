const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { thongKe, getCurrentBalance } = require('../controllers/baoCaoController');

router.use(requireAuth);
router.get('/', thongKe);
router.get('/so-du', getCurrentBalance);

module.exports = router;


