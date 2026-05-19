const express = require('express');
const router = express.Router();
const { validateProgressBody } = require('../middleware/validation');
const clueProgressController = require('../controllers/clueProgressController');

router.post('/', validateProgressBody, clueProgressController.create);

module.exports = router;
