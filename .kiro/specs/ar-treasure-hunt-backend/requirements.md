# Requirements Document

## Introduction

This document defines the requirements for the AR Treasure Hunt multiplayer game backend. The backend is built with Node.js and Express.js, providing REST APIs for AR content management, geospatial queries, game session persistence, and clue progress tracking. It integrates with MongoDB Atlas for data persistence, AWS S3 for file storage, and CloudFront CDN for asset delivery. The backend does NOT handle AR tracking, camera pose, scanning, marker detection, or AR rendering — those are client-side responsibilities.

## Glossary

- **Backend**: The Node.js + Express.js server application that handles API requests, data persistence, and file storage orchestration
- **AR_Content**: A MongoDB document representing a single AR clue, including its metadata, geospatial location, AR transform data, and CDN asset URLs
- **Content_Service**: The service layer responsible for creating, retrieving, and soft-deleting AR content records
- **Upload_Service**: The service responsible for receiving multipart form-data files and uploading them to AWS S3
- **CDN_URL_Generator**: The component that constructs CloudFront CDN URLs from S3 object keys
- **Geospatial_Query_Service**: The service that performs MongoDB 2dsphere geospatial queries to find nearby AR content
- **Session_Service**: The service responsible for creating and managing game sessions
- **Progress_Service**: The service responsible for tracking player clue collection progress
- **Marker_Image**: A PNG file representing the AR marker image uploaded for a clue
- **Clue_Render_Image**: A WebP file representing the rendered clue image uploaded for a clue
- **Soft_Delete**: A deletion strategy where records are flagged as deleted (isDeleted: true) rather than physically removed from the database
- **Game_Session**: A MongoDB document representing an active multiplayer game session
- **Clue_Progress**: A MongoDB document tracking which clues a player has collected within a session

## Requirements

### Requirement 1: AR Content Creation

**User Story:** As a game designer, I want to upload AR content with metadata and images, so that clues are persisted and available for players to discover.

#### Acceptance Criteria

1. WHEN a POST request with multipart/form-data containing contentJson, markerImage, and clueRenderImage is received at /api/ar-content, THE Backend SHALL parse the contentJson field into a structured object
2. WHEN contentJson is successfully parsed, THE Upload_Service SHALL upload the markerImage PNG file to AWS S3
3. WHEN contentJson is successfully parsed, THE Upload_Service SHALL upload the clueRenderImage WebP file to AWS S3
4. WHEN both files are uploaded to S3, THE CDN_URL_Generator SHALL generate CloudFront CDN URLs for each uploaded asset
5. WHEN CDN URLs are generated, THE Content_Service SHALL store the AR content document in MongoDB with geospatial location, AR transform data, world position/rotation data, marker anchor data, CDN URLs, and isDeleted set to false
6. WHEN the AR content document is successfully stored, THE Backend SHALL return the saved document with HTTP status 201
7. IF the contentJson field is missing or malformed, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message
8. IF the markerImage file is missing from the request, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message
9. IF the clueRenderImage file is missing from the request, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message
10. IF an S3 upload fails, THEN THE Backend SHALL return HTTP status 500 with a descriptive error message

### Requirement 2: Nearby AR Content Retrieval

**User Story:** As a player, I want to fetch AR content near my GPS location, so that I can discover clues in my vicinity without preloading all assets.

#### Acceptance Criteria

1. WHEN a GET request is received at /api/ar-content/nearby with lat, lon, and radius query parameters, THE Geospatial_Query_Service SHALL query MongoDB using a 2dsphere geospatial index to find AR_Content documents within the specified radius
2. THE Geospatial_Query_Service SHALL exclude documents where isDeleted is true from nearby query results
3. WHEN matching documents are found, THE Backend SHALL return the list of AR_Content documents with HTTP status 200
4. WHEN no matching documents are found, THE Backend SHALL return an empty array with HTTP status 200
5. IF the lat query parameter is missing or not a valid number, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message
6. IF the lon query parameter is missing or not a valid number, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message
7. IF the radius query parameter is missing or not a valid positive number, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message

### Requirement 3: Single AR Content Retrieval

**User Story:** As a player, I want to fetch the full details of a specific clue, so that I can load its AR assets and metadata when I approach it.

#### Acceptance Criteria

1. WHEN a GET request is received at /api/ar-content/:id with a valid document ID, THE Content_Service SHALL retrieve the AR_Content document from MongoDB
2. THE Content_Service SHALL exclude documents where isDeleted is true from single retrieval results
3. WHEN the document is found and not soft-deleted, THE Backend SHALL return the AR_Content document with HTTP status 200
4. IF no document matches the provided ID or the document is soft-deleted, THEN THE Backend SHALL return HTTP status 404 with a descriptive error message
5. IF the provided ID is not a valid MongoDB ObjectId format, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message

### Requirement 4: AR Content Soft Delete

**User Story:** As a game designer, I want to soft-delete AR content, so that clues can be removed from active gameplay without losing historical data.

#### Acceptance Criteria

1. WHEN a DELETE request is received at /api/ar-content/:id with a valid document ID, THE Content_Service SHALL set the isDeleted field to true on the matching AR_Content document
2. WHEN the soft delete is successful, THE Backend SHALL return HTTP status 200 with a confirmation message
3. IF no document matches the provided ID, THEN THE Backend SHALL return HTTP status 404 with a descriptive error message
4. IF the provided ID is not a valid MongoDB ObjectId format, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message
5. IF the document is already soft-deleted, THEN THE Backend SHALL return HTTP status 404 with a descriptive error message

### Requirement 5: Game Session Creation

**User Story:** As a player, I want to start a new game session, so that my progress and multiplayer interactions are tracked.

#### Acceptance Criteria

1. WHEN a POST request is received at /api/game-session/start with a valid request body containing player information, THE Session_Service SHALL create a new Game_Session document in MongoDB
2. WHEN the Game_Session document is successfully created, THE Backend SHALL return the session document with HTTP status 201
3. THE Session_Service SHALL record the session start timestamp when creating a new Game_Session
4. IF the request body is missing required player information, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message

### Requirement 6: Clue Progress Tracking

**User Story:** As a player, I want to record my clue collection progress, so that my achievements are persisted and visible to other players in multiplayer mode.

#### Acceptance Criteria

1. WHEN a POST request is received at /api/clue-progress with a valid request body containing sessionId, playerId, and clueId, THE Progress_Service SHALL create a new Clue_Progress document in MongoDB
2. WHEN the Clue_Progress document is successfully created, THE Backend SHALL return the progress document with HTTP status 201
3. THE Progress_Service SHALL record the collection timestamp when creating a new Clue_Progress document
4. IF the sessionId does not reference an existing Game_Session, THEN THE Backend SHALL return HTTP status 404 with a descriptive error message
5. IF the clueId does not reference an existing AR_Content document, THEN THE Backend SHALL return HTTP status 404 with a descriptive error message
6. IF the request body is missing required fields (sessionId, playerId, or clueId), THEN THE Backend SHALL return HTTP status 400 with a descriptive error message

### Requirement 7: MongoDB Geospatial Indexing

**User Story:** As a system operator, I want the database to use a 2dsphere index on AR content locations, so that geospatial queries perform efficiently at scale.

#### Acceptance Criteria

1. THE Backend SHALL create a 2dsphere index on the location field of the ar_content MongoDB collection
2. THE Backend SHALL store location data in GeoJSON Point format with coordinates as [longitude, latitude]

### Requirement 8: AR Content Document Structure

**User Story:** As a developer, I want a well-defined document schema for AR content, so that all required fields are consistently stored and retrievable.

#### Acceptance Criteria

1. THE Content_Service SHALL store a location field as a GeoJSON Point object with type and coordinates properties
2. THE Content_Service SHALL store AR transform data including localOffsetPosition, localOffsetRotationEuler, and localScale fields
3. THE Content_Service SHALL store world position and world rotation data fields
4. THE Content_Service SHALL store marker anchor data fields
5. THE Content_Service SHALL store markerImageUrl and clueRenderImageUrl fields containing CloudFront CDN URLs
6. THE Content_Service SHALL store an isDeleted boolean field defaulting to false
7. THE Content_Service SHALL store createdAt and updatedAt timestamp fields

### Requirement 9: S3 Upload and CDN URL Generation

**User Story:** As a developer, I want uploaded files stored in S3 with CDN URLs generated, so that assets are delivered efficiently to players worldwide.

#### Acceptance Criteria

1. WHEN a file is uploaded, THE Upload_Service SHALL store the file in the configured AWS S3 bucket with a unique key
2. WHEN a file is successfully stored in S3, THE CDN_URL_Generator SHALL construct a URL using the configured CloudFront distribution domain and the S3 object key
3. THE Upload_Service SHALL accept PNG files for marker images
4. THE Upload_Service SHALL accept WebP files for clue render images
5. IF the markerImage file is not a valid PNG, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message
6. IF the clueRenderImage file is not a valid WebP, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message

### Requirement 10: Content JSON Parsing and Validation

**User Story:** As a developer, I want the contentJson field to be parsed and validated, so that only well-formed AR content metadata is persisted.

#### Acceptance Criteria

1. WHEN contentJson is received as a string, THE Backend SHALL parse it into a JSON object
2. WHEN contentJson is received as an object (pre-parsed by middleware), THE Backend SHALL use it directly
3. IF contentJson cannot be parsed as valid JSON, THEN THE Backend SHALL return HTTP status 400 with a descriptive error message
4. FOR ALL valid AR_Content objects, parsing the contentJson then storing then retrieving SHALL produce an equivalent object (round-trip property)
