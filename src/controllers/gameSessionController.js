const sessionService = require('../services/sessionService');

/**
 * Starts a new game session.
 */
async function start(req, res, next) {
  try {
    const { playerId, playerName } = req.body;

    const savedSession = await sessionService.createSession({ playerId, playerName });

    res.status(201).json({ success: true, session: savedSession });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  start
};
