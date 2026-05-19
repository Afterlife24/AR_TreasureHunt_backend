const progressService = require('../services/progressService');

/**
 * Records clue collection progress.
 */
async function create(req, res, next) {
  try {
    const { sessionId, playerId, clueId } = req.body;

    const savedProgress = await progressService.recordProgress(sessionId, playerId, clueId);

    res.status(201).json({ success: true, progress: savedProgress });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create
};
