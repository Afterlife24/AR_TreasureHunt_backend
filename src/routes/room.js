const express = require('express');
const router = express.Router();
const { validateCreateRoom, validateJoinRoom, validateLinkClues } = require('../middleware/validation');
const roomController = require('../controllers/roomController');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates that req.params.roomId is a valid 24-character hexadecimal string.
 */
function validateObjectId(req, res, next) {
  const { roomId } = req.params;

  if (!roomId || !OBJECT_ID_REGEX.test(roomId)) {
    const error = new Error('Invalid ObjectId format');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  next();
}

// POST / — Create a new room
router.post('/', validateCreateRoom, roomController.create);

// POST /join — Join an existing room
router.post('/join', validateJoinRoom, roomController.join);

// GET /:roomId — Get room details
router.get('/:roomId', validateObjectId, roomController.getDetails);

// POST /:roomId/clues — Link clues to a room
router.post('/:roomId/clues', validateObjectId, validateLinkClues, roomController.linkClues);

module.exports = router;
