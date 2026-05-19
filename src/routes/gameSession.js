const express = require('express');
const router = express.Router();
const { validateSessionBody } = require('../middleware/validation');
const gameSessionController = require('../controllers/gameSessionController');

router.post('/start', validateSessionBody, gameSessionController.start);

module.exports = router;
