const Room = require('../models/Room');
const ArContent = require('../models/ArContent');

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 30 chars, no 0/O/1/I/L
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;

/**
 * Generates a unique 6-character alphanumeric room code.
 * Retries on collision (max 5 attempts).
 * @returns {Promise<string>} Unique room code
 */
async function generateRoomCode() {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * CHARSET.length);
      code += CHARSET[randomIndex];
    }

    const existing = await Room.findOne({ roomCode: code, status: 'active' });
    if (!existing) {
      return code;
    }
  }

  const error = new Error('Unable to generate unique room code after maximum attempts');
  error.code = 'GENERATION_ERROR';
  throw error;
}

/**
 * Creates a new room with the requesting player as host.
 * @param {string} playerId - Host player's ID
 * @param {string} playerName - Host player's display name
 * @returns {Promise<object>} The created room document
 */
async function createRoom(playerId, playerName) {
  const roomCode = await generateRoomCode();

  const room = new Room({
    roomCode,
    host: { playerId, playerName },
    members: [{ playerId, playerName, joinedAt: new Date() }],
    clueIds: [],
    status: 'active'
  });

  return await room.save();
}

/**
 * Adds a player to an existing active room.
 * @param {string} roomCode - 6-character room code
 * @param {string} playerId - Joining player's ID
 * @param {string} playerName - Joining player's display name
 * @returns {Promise<object>} The updated room document
 */
async function joinRoom(roomCode, playerId, playerName) {
  const room = await Room.findOne({ roomCode: roomCode.toUpperCase(), status: 'active' });
  if (!room) {
    const error = new Error('Room not found or is closed');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const alreadyMember = room.members.some(m => m.playerId === playerId);
  if (alreadyMember) {
    const error = new Error('Player is already a member of this room');
    error.code = 'ALREADY_MEMBER';
    throw error;
  }

  room.members.push({ playerId, playerName, joinedAt: new Date() });
  return await room.save();
}

/**
 * Gets room details by room ID.
 * @param {string} roomId - MongoDB ObjectId of the room
 * @returns {Promise<object>} Room document
 */
async function getRoomDetails(roomId) {
  const room = await Room.findById(roomId);
  if (!room) {
    const error = new Error('Room not found');
    error.code = 'NOT_FOUND';
    throw error;
  }
  return room;
}

/**
 * Links clue IDs to a room and sets roomId on each ArContent document.
 * Only the room host can perform this operation.
 * @param {string} roomId - MongoDB ObjectId of the room
 * @param {string} playerId - Requesting player's ID (must be host)
 * @param {string[]} clueIds - Array of ArContent ObjectIds to link
 * @returns {Promise<object>} Updated room document
 */
async function linkClues(roomId, playerId, clueIds) {
  const room = await Room.findOne({ _id: roomId, status: 'active' });
  if (!room) {
    const error = new Error('Room not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (room.host.playerId !== playerId) {
    const error = new Error('Only the room host can link clues');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const clues = await ArContent.find({
    _id: { $in: clueIds },
    isDeleted: false
  });
  if (clues.length !== clueIds.length) {
    const error = new Error('One or more clue IDs are invalid or deleted');
    error.code = 'NOT_FOUND';
    throw error;
  }

  await ArContent.updateMany(
    { _id: { $in: clueIds } },
    { $set: { roomId: roomId } }
  );

  const updatedRoom = await Room.findByIdAndUpdate(
    roomId,
    { $addToSet: { clueIds: { $each: clueIds } } },
    { new: true }
  );

  return updatedRoom;
}

/**
 * Validates whether a player is a member of a specific room.
 * @param {string} roomId - MongoDB ObjectId of the room
 * @param {string} playerId - Player ID to check
 * @returns {Promise<boolean>} True if player is a member
 */
async function validateMembership(roomId, playerId) {
  const room = await Room.findOne({
    _id: roomId,
    status: 'active',
    'members.playerId': playerId
  });

  return room !== null;
}

/**
 * Gets all active room IDs that a player belongs to.
 * @param {string} playerId - Player ID to look up
 * @returns {Promise<string[]>} Array of room ObjectId strings
 */
async function getPlayerRoomIds(playerId) {
  const rooms = await Room.find(
    { 'members.playerId': playerId, status: 'active' },
    { _id: 1 }
  );
  return rooms.map(r => r._id);
}

module.exports = {
  generateRoomCode,
  createRoom,
  joinRoom,
  getRoomDetails,
  linkClues,
  validateMembership,
  getPlayerRoomIds
};
