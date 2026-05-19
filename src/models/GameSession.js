const mongoose = require('mongoose');
const { Schema } = mongoose;

const gameSessionSchema = new Schema({
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' }
}, {
  timestamps: true // createdAt, updatedAt
});

module.exports = mongoose.model('GameSession', gameSessionSchema);
