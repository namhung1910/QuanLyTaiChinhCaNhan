const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { validatorsDangKy, validatorsDangNhap, dangKy, dangNhap, me } = require('../controllers/authController');

router.post('/dang-ky', validatorsDangKy, dangKy);
router.post('/dang-nhap', validatorsDangNhap, dangNhap);
router.get('/me', requireAuth, me);

module.exports = router;


