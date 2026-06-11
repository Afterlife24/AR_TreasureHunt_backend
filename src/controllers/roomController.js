const roomService = require('../services/roomService');

/**
 * Creates a new room with the requesting player as host.
 * POST /api/rooms
 */
async function create(req, res, next) {
  try {
    const { playerId, playerName } = req.body;
    const room = await roomService.createRoom(playerId, playerName);
    res.status(201).json({ success: true, room });
  } catch (error) {
    next(error);
  }
}

/**
 * Joins an existing room via room code.
 * POST /api/rooms/join
 */
async function join(req, res, next) {
  try {
    const { roomCode, playerId, playerName } = req.body;
    const room = await roomService.joinRoom(roomCode, playerId, playerName);
    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets room details including members and linked clues.
 * GET /api/rooms/:roomId
 */
async function getDetails(req, res, next) {
  try {
    const room = await roomService.getRoomDetails(req.params.roomId);
    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
}

/**
 * Links clue IDs to a room. Only host can link clues.
 * POST /api/rooms/:roomId/clues
 */
async function linkClues(req, res, next) {
  try {
    const { playerId, clueIds } = req.body;
    const room = await roomService.linkClues(req.params.roomId, playerId, clueIds);
    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  join,
  getDetails,
  linkClues
};
