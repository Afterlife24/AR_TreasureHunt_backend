# Tasks: Multiplayer Room Management

## Task 1: Create Room Model and Schema
- [x] 1.1 Create `src/models/Room.js` with roomCode, host, members, clueIds, and status fields
- [x] 1.2 Add compound index on `{ roomCode: 1, status: 1 }`
- [x] 1.3 Add compound index on `{ 'members.playerId': 1, status: 1 }`

## Task 2: Modify ArContent Schema
- [x] 2.1 Add optional `roomId` field (ObjectId, ref: 'Room', default: null) to `src/models/ArContent.js`
- [x] 2.2 Add compound index on `{ roomId: 1, isDeleted: 1 }`

## Task 3: Create Room Service
- [x] 3.1 Create `src/services/roomService.js` with `generateRoomCode()` function using 30-char charset and collision retry
- [x] 3.2 Implement `createRoom(playerId, playerName)` — generates code, creates room with host as initial member
- [x] 3.3 Implement `joinRoom(roomCode, playerId, playerName)` — case-insensitive lookup, duplicate member check, adds player
- [x] 3.4 Implement `getRoomDetails(roomId)` — fetches room by ID
- [x] 3.5 Implement `linkClues(roomId, playerId, clueIds)` — host-only enforcement, sets roomId on ArContent docs, adds to room clueIds
- [x] 3.6 Implement `validateMembership(roomId, playerId)` — checks if player is member of active room
- [x] 3.7 Implement `getPlayerRoomIds(playerId)` — returns all active room IDs for a player

## Task 4: Create Room Controller
- [x] 4.1 Create `src/controllers/roomController.js` with `create`, `join`, `getDetails`, and `linkClues` methods
- [x] 4.2 Each method delegates to roomService and formats HTTP responses

## Task 5: Create Room Validation Middleware
- [x] 5.1 Add `validateCreateRoom` to `src/middleware/validation.js` — validates playerId and playerName are non-empty strings
- [x] 5.2 Add `validateJoinRoom` to `src/middleware/validation.js` — validates roomCode, playerId, and playerName
- [x] 5.3 Add `validateLinkClues` to `src/middleware/validation.js` — validates playerId is non-empty, clueIds is array of valid ObjectIds

## Task 6: Create Room Routes
- [x] 6.1 Create `src/routes/room.js` with POST `/`, POST `/join`, GET `/:roomId`, POST `/:roomId/clues`
- [x] 6.2 Mount room routes in `src/app.js` at `/api/rooms`

## Task 7: Modify Progress Service for Room Membership Validation
- [x] 7.1 Update `src/services/progressService.js` `recordProgress` to check clue visibility and roomId
- [x] 7.2 When clue is private with roomId, call `roomService.validateMembership` and throw FORBIDDEN if not a member

## Task 8: Modify Content Service for Nearby Query Filtering
- [x] 8.1 Update `src/services/contentService.js` `findNearby` to accept optional `playerId` parameter
- [x] 8.2 When playerId is provided, call `roomService.getPlayerRoomIds` and filter private clues by membership
- [x] 8.3 When playerId is not provided, exclude private clues with roomId from results

## Task 9: Update ArContent Controller for Nearby Query
- [x] 9.1 Update `src/controllers/arContentController.js` `getNearby` to pass `playerId` query param to contentService.findNearby

## Task 10: Update Error Handler
- [x] 10.1 Add FORBIDDEN → 403 and ALREADY_MEMBER → 409 status mappings to `src/middleware/errorHandler.js`

## Task 11: Write Unit Tests for Room Service
- [ ] 11.1 Create `tests/unit/roomService.test.js` with tests for createRoom, joinRoom, validateMembership, linkClues, generateRoomCode
- [ ] 11.2 Test collision retry logic in generateRoomCode
- [ ] 11.3 Test host-only enforcement in linkClues
- [ ] 11.4 Test already-member rejection in joinRoom

## Task 12: Write Property-Based Tests
- [ ] 12.1 Create `tests/properties/roomCode.property.test.js` — room code format and charset invariants
- [ ] 12.2 Create `tests/properties/roomAccessControl.property.test.js` — public bypass, private membership gate

## Task 13: Write Integration Tests
- [ ] 13.1 Create `tests/integration/room.integration.test.js` — full room lifecycle (create, join, link, collect)
- [ ] 13.2 Test backward compatibility — public clue flows unchanged
- [ ] 13.3 Test nearby endpoint filtering with mixed public/private clues
