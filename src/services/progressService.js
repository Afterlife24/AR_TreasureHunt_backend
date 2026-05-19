const ClueProgress = require('../models/ClueProgress');
const GameSession = require('../models/GameSession');
const ArContent = require('../models/ArContent');

/**
 * Records clue progress for a player in a game session.
 * Validates that the sessionId and clueId reference existing documents.
 * @param {string} sessionId - MongoDB ObjectId of the game session
 * @param {string} playerId - Player identifier
 * @param {string} clueId - MongoDB ObjectId of the AR content clue
 * @returns {Promise<object>} The created clue progress document
 */
async function recordProgress(sessionId, playerId, clueId) {
  // Validate sessionId references an existing game session
  const session = await GameSession.findById(sessionId);
  if (!session) {
    const error = new Error('Game session not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Validate clueId references an existing non-deleted AR content
  const content = await ArContent.findOne({ _id: clueId, isDeleted: false });
  if (!content) {
    const error = new Error('AR content clue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  try {
    const progress = new ClueProgress({ sessionId, playerId, clueId });
    return await progress.save();
  } catch (err) {
    const error = new Error(`Failed to record clue progress: ${err.message}`);
    error.code = 'DATABASE_ERROR';
    throw error;
  }
}

module.exports = {
  recordProgress
};
