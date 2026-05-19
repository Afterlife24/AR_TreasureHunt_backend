const GameSession = require('../models/GameSession');

/**
 * Creates a new game session.
 * @param {object} playerInfo - Object containing playerId and playerName
 * @returns {Promise<object>} The created game session document
 */
async function createSession(playerInfo) {
  try {
    const session = new GameSession(playerInfo);
    return await session.save();
  } catch (err) {
    const error = new Error(`Failed to create game session: ${err.message}`);
    error.code = 'DATABASE_ERROR';
    throw error;
  }
}

module.exports = {
  createSession
};
