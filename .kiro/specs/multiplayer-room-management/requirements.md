# Requirements Document: Multiplayer Room Management

## Overview

This document defines the functional and non-functional requirements for adding multiplayer room management to the AR Treasure Hunt backend. Requirements are derived from the technical design and cover room lifecycle, membership, clue linking, access control, and integration with existing systems.

---

## Requirement 1: Room Creation

### 1.1 Create Room Endpoint
GIVEN a POST request to `/api/rooms` with a valid `playerId` and `playerName`
WHEN the server processes the request
THEN it SHALL return HTTP 201 with a room object containing a unique `roomCode`, the host information, and status `active`

### 1.2 Room Code Generation
GIVEN a room creation request
WHEN the server generates a room code
THEN the code SHALL be exactly 6 characters long, using only characters from the set `ABCDEFGHJKMNPQRSTUVWXYZ23456789`

### 1.3 Room Code Uniqueness
GIVEN a room creation request
WHEN the server generates a room code
THEN the generated code SHALL NOT match any existing active room's code in the database

### 1.4 Host as Initial Member
GIVEN a successful room creation
WHEN the room document is saved
THEN the `members` array SHALL contain exactly one entry with the host's `playerId` and `playerName`

### 1.5 Room Initial State
GIVEN a successful room creation
WHEN the room document is returned
THEN it SHALL have `status: 'active'`, an empty `clueIds` array, and valid `createdAt`/`updatedAt` timestamps

### 1.6 Validation - Missing playerId
GIVEN a POST request to `/api/rooms` without a `playerId` or with an empty `playerId`
WHEN the server validates the request
THEN it SHALL return HTTP 400 with error code `VALIDATION_ERROR`

### 1.7 Validation - Missing playerName
GIVEN a POST request to `/api/rooms` without a `playerName` or with an empty `playerName`
WHEN the server validates the request
THEN it SHALL return HTTP 400 with error code `VALIDATION_ERROR`

---

## Requirement 2: Join Room

### 2.1 Join Room Endpoint
GIVEN a POST request to `/api/rooms/join` with a valid `roomCode`, `playerId`, and `playerName`
WHEN the room exists and is active and the player is not already a member
THEN it SHALL return HTTP 200 with the updated room object including the new member

### 2.2 Case-Insensitive Room Code Matching
GIVEN a join request with a room code in any case (e.g., "abc123", "ABC123", "Abc123")
WHEN the server looks up the room
THEN it SHALL match the room regardless of the input's letter case

### 2.3 Room Not Found
GIVEN a join request with a `roomCode` that does not match any active room
WHEN the server processes the request
THEN it SHALL return HTTP 404 with error code `NOT_FOUND`

### 2.4 Room Closed
GIVEN a join request for a room with `status: 'closed'`
WHEN the server processes the request
THEN it SHALL return HTTP 404 with error code `NOT_FOUND`

### 2.5 Already a Member
GIVEN a join request where the `playerId` is already in the room's `members` array
WHEN the server processes the request
THEN it SHALL return HTTP 409 with error code `ALREADY_MEMBER`

### 2.6 Member Added to Array
GIVEN a successful join operation
WHEN the room is updated
THEN the `members` array SHALL contain a new entry with the player's `playerId`, `playerName`, and a `joinedAt` timestamp

### 2.7 Validation - Missing Fields
GIVEN a join request missing `roomCode`, `playerId`, or `playerName`
WHEN the server validates the request
THEN it SHALL return HTTP 400 with error code `VALIDATION_ERROR`

---

## Requirement 3: Get Room Details

### 3.1 Get Room Details Endpoint
GIVEN a GET request to `/api/rooms/:roomId` with a valid room ObjectId
WHEN the room exists
THEN it SHALL return HTTP 200 with the complete room document (code, host, members, clueIds, status)

### 3.2 Room Not Found
GIVEN a GET request to `/api/rooms/:roomId` with an ID that doesn't match any room
WHEN the server processes the request
THEN it SHALL return HTTP 404 with error code `NOT_FOUND`

### 3.3 Validation - Invalid ObjectId
GIVEN a GET request to `/api/rooms/:roomId` where `:roomId` is not a valid 24-character hex string
WHEN the server validates the request
THEN it SHALL return HTTP 400 with error code `VALIDATION_ERROR`

---

## Requirement 4: Link Clues to Room

### 4.1 Link Clues Endpoint
GIVEN a POST request to `/api/rooms/:roomId/clues` with a valid `playerId` (matching the host) and a valid `clueIds` array
WHEN all clue IDs reference existing non-deleted ArContent documents
THEN it SHALL return HTTP 200 with the updated room including the linked clue IDs

### 4.2 Sets roomId on ArContent Documents
GIVEN a successful link clues operation
WHEN the ArContent documents are updated
THEN each referenced ArContent document SHALL have its `roomId` field set to the room's ObjectId

### 4.3 Host-Only Enforcement
GIVEN a link clues request where `playerId` does NOT match the room's `host.playerId`
WHEN the server processes the request
THEN it SHALL return HTTP 403 with error code `FORBIDDEN` and no documents SHALL be modified

### 4.4 No Duplicate Clue Links
GIVEN a link clues request that includes clue IDs already linked to the room
WHEN the server updates the room
THEN the `clueIds` array SHALL NOT contain duplicate entries (uses addToSet semantics)

### 4.5 Invalid Clue IDs
GIVEN a link clues request where one or more `clueIds` reference non-existent or deleted ArContent documents
WHEN the server validates the clue IDs
THEN it SHALL return HTTP 404 with error code `NOT_FOUND` and no documents SHALL be modified

### 4.6 Validation - Missing Fields
GIVEN a link clues request missing `playerId` or `clueIds`
WHEN the server validates the request
THEN it SHALL return HTTP 400 with error code `VALIDATION_ERROR`

### 4.7 Validation - clueIds Format
GIVEN a link clues request where `clueIds` is not an array or contains invalid ObjectId strings
WHEN the server validates the request
THEN it SHALL return HTTP 400 with error code `VALIDATION_ERROR`

---

## Requirement 5: Private Clue Access Control (Clue Progress)

### 5.1 Public Clue Collection Unchanged
GIVEN a POST request to `/api/clue-progress` for a clue where `visibility !== 'private'` OR `roomId` is null
WHEN the server processes the request
THEN it SHALL record progress without any room membership validation (existing behavior preserved)

### 5.2 Private Clue - Member Can Collect
GIVEN a clue-progress request for a clue where `visibility === 'private'` AND `roomId` is set
WHEN the requesting `playerId` IS in the `members` array of the linked room
THEN the server SHALL record progress successfully and return HTTP 201

### 5.3 Private Clue - Non-Member Rejected
GIVEN a clue-progress request for a clue where `visibility === 'private'` AND `roomId` is set
WHEN the requesting `playerId` is NOT in the `members` array of the linked room
THEN the server SHALL return HTTP 403 with error code `FORBIDDEN`

### 5.4 Private Clue - Closed Room Rejected
GIVEN a clue-progress request for a private clue linked to a room with `status: 'closed'`
WHEN the server checks membership
THEN it SHALL return HTTP 403 with error code `FORBIDDEN` (closed rooms have no active members)

---

## Requirement 6: Nearby Query Filtering

### 6.1 Public Clues Always Returned
GIVEN a GET request to `/api/ar-content/nearby` with valid coordinates and radius
WHEN public clues (visibility !== 'private' or roomId is null) exist within the radius
THEN they SHALL always be included in results regardless of whether a `playerId` is provided

### 6.2 Private Clues Filtered by Membership
GIVEN a nearby query with a `playerId` parameter
WHEN private clues with `roomId` exist within the radius
THEN only clues where the player is a member of the linked room SHALL be included

### 6.3 No playerId - Private Clues Excluded
GIVEN a nearby query WITHOUT a `playerId` parameter
WHEN private clues with `roomId` exist within the radius
THEN they SHALL NOT be included in the results

### 6.4 Backward Compatibility
GIVEN a nearby query without a `playerId` parameter
WHEN the system processes the request
THEN the response format and public clue results SHALL be identical to the existing behavior before this feature

---

## Requirement 7: Room Data Model

### 7.1 Room Schema Fields
GIVEN the Room model
THEN it SHALL contain: `roomCode` (String, unique, required), `host` (object with playerId and playerName), `members` (array of objects), `clueIds` (array of ObjectId refs to ArContent), `status` (enum: active/closed), and timestamps

### 7.2 Room Code Index
GIVEN the Room collection
THEN it SHALL have a compound index on `{ roomCode: 1, status: 1 }` for efficient code lookups

### 7.3 Membership Index
GIVEN the Room collection
THEN it SHALL have a compound index on `{ 'members.playerId': 1, status: 1 }` for efficient membership queries

---

## Requirement 8: ArContent Schema Modification

### 8.1 roomId Field Addition
GIVEN the ArContent schema
THEN a new optional field `roomId` of type ObjectId (ref: 'Room') with default null SHALL be added

### 8.2 Backward Compatibility
GIVEN existing ArContent documents without a `roomId` field
WHEN they are queried
THEN they SHALL continue to function exactly as before (treated as public/non-room clues)

### 8.3 Room Content Index
GIVEN the ArContent collection
THEN it SHALL have a compound index on `{ roomId: 1, isDeleted: 1 }` for efficient room-based content queries

---

## Requirement 9: Route Integration

### 9.1 New Route Mount
GIVEN the Express application
THEN a new route file SHALL be mounted at `/api/rooms` handling all room-related endpoints

### 9.2 Existing Routes Unchanged
GIVEN existing routes (`/api/ar-content`, `/api/game-sessions`, `/api/clue-progress`)
WHEN the multiplayer room feature is deployed
THEN existing route paths and their behavior for public content SHALL remain unchanged

---

## Requirement 10: Error Handling

### 10.1 Consistent Error Format
GIVEN any error response from room endpoints
THEN it SHALL follow the existing error format: `{ error: { code: string, message: string } }`

### 10.2 HTTP Status Code Mapping
GIVEN room-related errors
THEN: VALIDATION_ERROR → 400, FORBIDDEN → 403, NOT_FOUND → 404, ALREADY_MEMBER → 409, GENERATION_ERROR → 500
