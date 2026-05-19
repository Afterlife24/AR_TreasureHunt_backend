# Implementation Plan: AR Treasure Hunt Backend

## Overview

This plan implements a Node.js + Express.js REST API backend for a multiplayer AR Treasure Hunt game. The implementation follows a layered architecture (Routes → Middleware → Controllers → Services → Data Access) with MongoDB Atlas for persistence, AWS S3 for file storage, and CloudFront CDN for asset delivery. Tasks are ordered to build foundational layers first, then wire them together incrementally.

## Tasks

- [x] 1. Set up project structure and configuration
  - [x] 1.1 Initialize Node.js project with dependencies
    - Create `package.json` with Express, Mongoose, Multer, AWS SDK v3, dotenv, uuid
    - Add dev dependencies: Jest, Supertest, fast-check, mongodb-memory-server
    - Create `.env.example` with all required environment variables (PORT, MONGODB_URI, AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, CLOUDFRONT_DOMAIN)
    - Configure Jest in `jest.config.js`
    - _Requirements: 9.1, 9.2_

  - [x] 1.2 Create application entry point and Express app setup
    - Create `src/app.js` configuring Express with JSON parsing and route mounting
    - Create `src/server.js` for MongoDB connection and server startup
    - Set up route prefixes: `/api/ar-content`, `/api/game-session`, `/api/clue-progress`
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ] 2. Implement data models (Mongoose schemas)
  - [x] 2.1 Create ArContent model
    - Define schema in `src/models/ArContent.js` with: location (GeoJSON Point), localOffsetPosition, localOffsetRotationEuler, localScale, worldPosition, worldRotation (quaternion with w), markerLocalOffset, markerImageUrl, clueRenderImageUrl, isDeleted (default false), metadata (Mixed), timestamps
    - Create 2dsphere index on location field
    - Create compound index on `{ isDeleted: 1, location: '2dsphere' }`
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 2.2 Create GameSession model
    - Define schema in `src/models/GameSession.js` with: playerId, playerName, startedAt (default Date.now), status (enum: active/completed/abandoned, default active), timestamps
    - _Requirements: 5.1, 5.3_

  - [x] 2.3 Create ClueProgress model
    - Define schema in `src/models/ClueProgress.js` with: sessionId (ObjectId ref GameSession), playerId, clueId (ObjectId ref ArContent), collectedAt (default Date.now), timestamps
    - Create unique compound index on `{ sessionId, playerId, clueId }`
    - _Requirements: 6.1, 6.3_

  - [ ] 2.4 Write property tests for data models
    - **Property 10: GeoJSON Point format storage** — For any valid lat/lon pair, stored location SHALL be GeoJSON Point with coordinates in [longitude, latitude] order
    - **Property 11: AR content document schema completeness** — For any valid creation request, stored document SHALL contain all required fields
    - **Validates: Requirements 7.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

- [x] 3. Implement services layer
  - [x] 3.1 Implement UploadService
    - Create `src/services/uploadService.js` with `uploadFile(buffer, key, contentType)` and `generateS3Key(prefix, originalName)` methods
    - Use AWS SDK v3 `@aws-sdk/client-s3` PutObjectCommand
    - Generate unique keys with format `{prefix}/{uuid}-{timestamp}.{ext}`
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ]* 3.2 Write property test for S3 key uniqueness
    - **Property 9: S3 key uniqueness** — For any sequence of file uploads with arbitrary original filenames (including duplicates), all generated S3 keys SHALL be unique
    - **Validates: Requirements 9.1**

  - [x] 3.3 Implement CdnUrlGenerator
    - Create `src/services/cdnUrlGenerator.js` with `generateUrl(s3Key)` method
    - Construct URL as `https://{CLOUDFRONT_DOMAIN}/{s3Key}`
    - Pure function with no side effects
    - _Requirements: 1.4, 9.2_

  - [ ]* 3.4 Write property test for CDN URL generation
    - **Property 2: CDN URL generation correctness** — For any S3 object key, the generated URL SHALL start with the configured CloudFront domain prefix and end with the exact S3 key
    - **Validates: Requirements 1.4, 9.2**

  - [x] 3.5 Implement ContentService
    - Create `src/services/contentService.js` with `create(contentData)`, `findNearby(lat, lon, radiusMeters)`, `findById(id)`, `softDelete(id)` methods
    - All read queries include `{ isDeleted: false }` filter
    - `findNearby` uses `$nearSphere` with `$maxDistance` in meters
    - `softDelete` returns null if document not found or already deleted
    - _Requirements: 1.5, 2.1, 2.2, 3.1, 3.2, 4.1, 4.5_

  - [ ]* 3.6 Write property tests for ContentService
    - **Property 1: Content JSON round-trip preservation** — For any valid AR content object, storing then retrieving SHALL produce equivalent field values
    - **Property 3: Soft-delete exclusion invariant** — For any document where isDeleted is true, no read query SHALL return that document
    - **Property 4: Soft-delete idempotence** — After successful soft-delete, subsequent soft-delete attempts SHALL return null (404)
    - **Property 12: Geospatial query returns only nearby results** — All returned documents SHALL have location within specified radius
    - **Validates: Requirements 10.4, 1.1, 2.2, 3.2, 4.1, 4.5, 2.1**

  - [x] 3.7 Implement SessionService
    - Create `src/services/sessionService.js` with `createSession(playerInfo)` method
    - Record startedAt timestamp on creation
    - _Requirements: 5.1, 5.3_

  - [x] 3.8 Implement ProgressService
    - Create `src/services/progressService.js` with `recordProgress(sessionId, playerId, clueId)` method
    - Validate sessionId references existing GameSession
    - Validate clueId references existing (non-deleted) ArContent
    - Record collectedAt timestamp on creation
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

  - [ ]* 3.9 Write property test for timestamps
    - **Property 13: Document creation timestamps** — For any successfully created document, the timestamp field SHALL not be in the future relative to response time
    - **Validates: Requirements 5.3, 6.3**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement middleware
  - [x] 5.1 Implement Multer upload middleware
    - Create `src/middleware/upload.js` configuring multer with memory storage
    - Accept fields: `markerImage` (single file), `clueRenderImage` (single file)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Implement validation middleware
    - Create `src/middleware/validation.js` with:
      - `validateArContent` — parse/validate contentJson, check file presence, validate PNG magic bytes (89 50 4E 47) for markerImage, validate WebP signature (52 49 46 46 ... 57 45 42 50) for clueRenderImage
      - `validateNearbyQuery` — validate lat (number, -90 to 90), lon (number, -180 to 180), radius (positive number)
      - `validateObjectId` — validate `:id` param is 24-char hex string
    - _Requirements: 1.7, 1.8, 1.9, 2.5, 2.6, 2.7, 3.5, 4.4, 9.5, 9.6, 10.1, 10.2, 10.3_

  - [ ]* 5.3 Write property tests for validation middleware
    - **Property 5: Nearby query parameter validation** — For any request where lat/lon/radius are invalid, system SHALL reject with HTTP 400
    - **Property 6: ObjectId format validation** — For any string that is not a valid 24-char hex ObjectId, system SHALL return HTTP 400
    - **Property 7: Invalid JSON rejection** — For any string that is not valid JSON submitted as contentJson, system SHALL reject with HTTP 400
    - **Property 8: File type validation** — For any buffer not matching PNG/WebP magic bytes, system SHALL reject with HTTP 400
    - **Property 14: Required field validation for session and progress** — For any request missing required fields, system SHALL reject with HTTP 400
    - **Validates: Requirements 2.5, 2.6, 2.7, 3.5, 4.4, 1.7, 10.3, 9.5, 9.6, 5.4, 6.6**

  - [x] 5.4 Implement error handler middleware
    - Create `src/middleware/errorHandler.js` with consistent JSON error response format: `{ error: { code, message, details } }`
    - Map error types to HTTP status codes: VALIDATION_ERROR → 400, NOT_FOUND → 404, UPLOAD_ERROR → 500, DATABASE_ERROR → 500, INTERNAL_ERROR → 500
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 2.5, 2.6, 2.7, 3.4, 3.5, 4.3, 4.4_

- [x] 6. Implement controllers
  - [x] 6.1 Implement ArContentController
    - Create `src/controllers/arContentController.js` with `create`, `getNearby`, `getById`, `softDelete` methods
    - `create`: orchestrate UploadService calls for both files, generate CDN URLs, call ContentService.create, return 201
    - `getNearby`: extract lat/lon/radius from query params, call ContentService.findNearby, return 200
    - `getById`: call ContentService.findById, return 200 or 404
    - `softDelete`: call ContentService.softDelete, return 200 or 404
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.3, 2.4, 3.1, 3.3, 3.4, 4.1, 4.2, 4.3_

  - [x] 6.2 Implement GameSessionController
    - Create `src/controllers/gameSessionController.js` with `start` method
    - Validate required fields (playerId, playerName), call SessionService.createSession, return 201
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 6.3 Implement ClueProgressController
    - Create `src/controllers/clueProgressController.js` with `create` method
    - Validate required fields (sessionId, playerId, clueId), call ProgressService.recordProgress, return 201
    - Handle 404 for invalid sessionId or clueId references
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_

- [x] 7. Wire routes together
  - [x] 7.1 Create route files and mount to Express app
    - Create `src/routes/arContent.js` — wire POST /, GET /nearby, GET /:id, DELETE /:id with middleware and controller
    - Create `src/routes/gameSession.js` — wire POST /start with controller
    - Create `src/routes/clueProgress.js` — wire POST / with controller
    - Mount all routes in `src/app.js`
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Integration tests
  - [ ]* 9.1 Write integration tests for AR content endpoints
    - Test full content creation flow with multipart upload (POST → 201)
    - Test nearby query with real 2dsphere index (GET /nearby → 200)
    - Test single retrieval (GET /:id → 200, 404)
    - Test soft-delete then verify exclusion from queries
    - Use mongodb-memory-server and Supertest
    - _Requirements: 1.1–1.10, 2.1–2.7, 3.1–3.5, 4.1–4.5_

  - [ ]* 9.2 Write integration tests for game session and clue progress
    - Test session creation (POST /game-session/start → 201)
    - Test progress tracking with valid references (POST /clue-progress → 201)
    - Test referential integrity (invalid sessionId → 404, invalid clueId → 404)
    - _Requirements: 5.1–5.4, 6.1–6.6_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (14 properties total)
- Unit tests validate specific examples and edge cases
- Integration tests use mongodb-memory-server for real MongoDB behavior without external dependencies
- AWS S3 calls are mocked in unit/property tests; only integration tests may optionally mock at the HTTP level
