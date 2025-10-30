const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { validatorsCreate, list, create, update, remove } = require('../controllers/danhMucController');

router.use(requireAuth);
router.get('/', list);
router.post('/', validatorsCreate, create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;


