const mongoose = require('mongoose');
const { Schema } = mongoose;

const clueProgressSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  playerId: { type: String, required: true },
  clueId: { type: Schema.Types.ObjectId, ref: 'ArContent', required: true },
  collectedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // createdAt, updatedAt
});

// Prevent duplicate progress entries
clueProgressSchema.index({ sessionId: 1, playerId: 1, clueId: 1 }, { unique: true });

module.exports = mongoose.model('ClueProgress', clueProgressSchema);
