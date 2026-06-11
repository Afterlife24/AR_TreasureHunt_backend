const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomSchema = new Schema({
  // Unique short code for sharing
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z0-9]{6}$/
  },

  // Room creator
  host: {
    playerId: { type: String, required: true },
    playerName: { type: String, required: true }
  },

  // All players in the room (including host)
  members: [{
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
  }],

  // Clues linked to this room
  clueIds: [{ type: Schema.Types.ObjectId, ref: 'ArContent' }],

  // Room lifecycle
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Index for fast room code lookups
roomSchema.index({ roomCode: 1, status: 1 });

// Index for finding rooms by player membership
roomSchema.index({ 'members.playerId': 1, status: 1 });

module.exports = mongoose.model('Room', roomSchema);
