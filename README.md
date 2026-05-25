# AR Treasure Hunt Backend

Backend API for a multiplayer AR Treasure Hunt game. Built with Node.js, Express.js, MongoDB Atlas, AWS S3, and CloudFront CDN. Deployed as an AWS Lambda function via Serverless Framework.

## Base URL

```
https://hevab67acf.execute-api.eu-west-3.amazonaws.com
```

## Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Database**: MongoDB Atlas (2dsphere geospatial index)
- **File Storage**: AWS S3
- **CDN**: CloudFront
- **Deployment**: AWS Lambda + API Gateway (Serverless Framework v3)
- **CI/CD**: GitHub Actions (auto-deploy on push to main)

## API Endpoints

### Health Check

```
GET /
```

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "service": "ar-treasure-hunt-api"
}
```

---

### Save AR Content

```
POST /api/ar-content
```

Uploads a new AR clue with marker image and clue render image. Unity sends this when a player places a clue in the real world.

**Content-Type:** `multipart/form-data`

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `contentJson` | string (JSON) | Clue metadata (position, rotation, scale, etc.) |
| `markerImage` | file (PNG) | AR marker image captured from real surface |
| `clueRenderImage` | file (WebP) | Visual clue image displayed in AR |

**contentJson fields:**

```json
{
  "id": "c9f1f1b2-1234",
  "type": "clue",
  "ownerUserId": "user_101",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "altitude": 35.0,
  "triggerRadiusMeters": 10,
  "visibility": "public",
  "content": "Find the hidden dragon",
  "localOffsetPosition": { "x": 0.25, "y": 0.5, "z": -1.2 },
  "localOffsetRotationEuler": { "x": 0, "y": 90, "z": 0 },
  "localScale": { "x": 1, "y": 1, "z": 1 },
  "heading": 180,
  "worldPosition": { "x": 10.2, "y": 1.4, "z": -4.1 },
  "worldRotationEuler": { "x": 0, "y": 45, "z": 0 },
  "useMarkerAnchor": true,
  "markerLocalOffset": { "x": 0, "y": 0.2, "z": -0.5 }
}
```

**Response (201):**
```json
{
  "success": true,
  "item": {
    "_id": "664abc...",
    "markerImageUrl": "https://d1h1hne9sbuk0o.cloudfront.net/markers/uuid-timestamp.png",
    "clueRenderImageUrl": "https://d1h1hne9sbuk0o.cloudfront.net/clues/uuid-timestamp.webp",
    "location": { "type": "Point", "coordinates": [2.3522, 48.8566] },
    "..."
  }
}
```

---

### Fetch Nearby AR Content

```
GET /api/ar-content/nearby?lat={latitude}&lon={longitude}&radius={meters}
```

Returns all AR clues within a GPS radius. Used by Unity to load nearby clues when a player opens the app.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `lat` | number | Latitude (-90 to 90) |
| `lon` | number | Longitude (-180 to 180) |
| `radius` | number | Search radius in meters |

**Example:**
```
GET /api/ar-content/nearby?lat=48.8566&lon=2.3522&radius=500
```

**Response (200):**
```json
{
  "items": [
    {
      "_id": "664abc...",
      "type": "clue",
      "content": "Find the hidden dragon",
      "markerImageUrl": "https://d1h1hne9sbuk0o.cloudfront.net/markers/...",
      "clueRenderImageUrl": "https://d1h1hne9sbuk0o.cloudfront.net/clues/...",
      "useMarkerAnchor": true,
      "markerLocalOffset": { "x": 0, "y": 0.2, "z": -0.5 },
      "localOffsetPosition": { "x": 0.25, "y": 0.5, "z": -1.2 },
      "localOffsetRotationEuler": { "x": 0, "y": 90, "z": 0 },
      "localScale": { "x": 1, "y": 1, "z": 1 },
      "..."
    }
  ]
}
```

---

### Get Single AR Content

```
GET /api/ar-content/:id
```

Fetches full details of a specific clue by its MongoDB ID.

**Response (200):**
```json
{
  "item": { "..." }
}
```

**Error (404):** Clue not found or soft-deleted.

---

### Soft Delete AR Content

```
DELETE /api/ar-content/:id
```

Marks a clue as deleted (sets `isDeleted: true`). The clue won't appear in nearby queries or single retrieval anymore, but data is preserved.

**Response (200):**
```json
{
  "success": true,
  "message": "AR content deleted"
}
```

---

### Start Game Session

```
POST /api/game-sessions/start
```

Creates a new game session for a player.

**Body:**
```json
{
  "playerId": "player_001",
  "playerName": "Alice"
}
```

**Response (201):**
```json
{
  "success": true,
  "session": {
    "_id": "664def...",
    "playerId": "player_001",
    "playerName": "Alice",
    "startedAt": "2026-05-26T10:00:00.000Z",
    "status": "active"
  }
}
```

---

### Record Clue Progress

```
POST /api/clue-progress
```

Records that a player collected a clue during a session.

**Body:**
```json
{
  "sessionId": "664def...",
  "playerId": "player_001",
  "clueId": "664abc..."
}
```

**Response (201):**
```json
{
  "success": true,
  "progress": {
    "_id": "664ghi...",
    "sessionId": "664def...",
    "playerId": "player_001",
    "clueId": "664abc...",
    "collectedAt": "2026-05-26T10:05:00.000Z"
  }
}
```

**Error (404):** Invalid sessionId or clueId.

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Description of what went wrong"
  }
}
```

| HTTP Status | Error Code | Trigger |
|-------------|-----------|---------|
| 400 | `VALIDATION_ERROR` | Missing/invalid fields, bad JSON, wrong file type |
| 404 | `NOT_FOUND` | Document doesn't exist or is soft-deleted |
| 500 | `UPLOAD_ERROR` | S3 upload failure |
| 500 | `DATABASE_ERROR` | MongoDB connection/query failure |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

## Environment Variables

```
PORT=3000
MONGODB_URI=mongodb+srv://...
AWS_S3_BUCKET=ar-treasure-hunt-assets
CLOUDFRONT_DOMAIN=d1h1hne9sbuk0o.cloudfront.net
```

## Local Development

```bash
npm install
cp .env.example .env
# Fill in your .env values
npm start
```

## Deployment

Push to `main` branch triggers automatic deployment via GitHub Actions.

Manual deploy:
```bash
serverless deploy
```

## Project Structure

```
├── src/
│   ├── controllers/       # Request handlers
│   ├── middleware/         # Multer, validation, error handling
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express route wiring
│   ├── services/          # Business logic (S3, CDN, CRUD)
│   ├── app.js             # Express app config
│   └── server.js          # Local server startup
├── lambda.js              # AWS Lambda entry point
├── serverless.yml         # Serverless Framework config
├── .github/workflows/     # CI/CD pipeline
├── .env.example           # Environment variable template
└── package.json
```
