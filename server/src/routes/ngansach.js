const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { validatorsCreate, list, create, update, remove, canhBao } = require('../controllers/nganSachController');

router.use(requireAuth);
router.get('/', list);
router.get('/canh-bao', canhBao);
router.post('/', validatorsCreate, create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;


