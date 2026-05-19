/**
 * Validation middleware for AR Treasure Hunt API.
 */

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates AR content creation requests.
 * Checks contentJson, file presence, and file type signatures.
 */
function validateArContent(req, res, next) {
  // Parse contentJson
  let contentJson;
  if (typeof req.body.contentJson === 'string') {
    try {
      contentJson = JSON.parse(req.body.contentJson);
    } catch (e) {
      const error = new Error('contentJson must be valid JSON');
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }
  } else if (typeof req.body.contentJson === 'object' && req.body.contentJson !== null) {
    contentJson = req.body.contentJson;
  } else {
    const error = new Error('contentJson is required');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  // Check markerImage file presence
  if (!req.files || !req.files.markerImage || req.files.markerImage.length === 0) {
    const error = new Error('markerImage file is required');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  // Check clueRenderImage file presence
  if (!req.files || !req.files.clueRenderImage || req.files.clueRenderImage.length === 0) {
    const error = new Error('clueRenderImage file is required');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  // Validate PNG magic bytes for markerImage
  const markerBuffer = req.files.markerImage[0].buffer;
  if (
    markerBuffer.length < 4 ||
    markerBuffer[0] !== 0x89 ||
    markerBuffer[1] !== 0x50 ||
    markerBuffer[2] !== 0x4E ||
    markerBuffer[3] !== 0x47
  ) {
    const error = new Error('markerImage must be a valid PNG file');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  // Validate WebP signature for clueRenderImage
  // Bytes 0-3: RIFF, Bytes 8-11: WEBP
  const clueBuffer = req.files.clueRenderImage[0].buffer;
  if (
    clueBuffer.length < 12 ||
    clueBuffer[0] !== 0x52 || // R
    clueBuffer[1] !== 0x49 || // I
    clueBuffer[2] !== 0x46 || // F
    clueBuffer[3] !== 0x46 || // F
    clueBuffer[8] !== 0x57 || // W
    clueBuffer[9] !== 0x45 || // E
    clueBuffer[10] !== 0x42 || // B
    clueBuffer[11] !== 0x50    // P
  ) {
    const error = new Error('clueRenderImage must be a valid WebP file');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  // Attach parsed content to request
  req.parsedContent = contentJson;
  next();
}

/**
 * Validates nearby query parameters (lat, lon, radius).
 */
function validateNearbyQuery(req, res, next) {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const radius = parseFloat(req.query.radius);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    const error = new Error('lat must be a number between -90 and 90');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  if (isNaN(lon) || lon < -180 || lon > 180) {
    const error = new Error('lon must be a number between -180 and 180');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  if (isNaN(radius) || radius <= 0) {
    const error = new Error('radius must be a positive number');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  next();
}

/**
 * Validates that req.params.id is a valid 24-character hexadecimal string.
 */
function validateObjectId(req, res, next) {
  const { id } = req.params;

  if (!id || !OBJECT_ID_REGEX.test(id)) {
    const error = new Error('Invalid ObjectId format');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  next();
}

/**
 * Validates game session creation body (playerId, playerName).
 */
function validateSessionBody(req, res, next) {
  const { playerId, playerName } = req.body;

  if (!playerId || typeof playerId !== 'string' || playerId.trim() === '') {
    const error = new Error('playerId must be a non-empty string');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  if (!playerName || typeof playerName !== 'string' || playerName.trim() === '') {
    const error = new Error('playerName must be a non-empty string');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  next();
}

/**
 * Validates clue progress creation body (sessionId, playerId, clueId).
 */
function validateProgressBody(req, res, next) {
  const { sessionId, playerId, clueId } = req.body;

  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
    const error = new Error('sessionId must be a non-empty string');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  if (!playerId || typeof playerId !== 'string' || playerId.trim() === '') {
    const error = new Error('playerId must be a non-empty string');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  if (!clueId || typeof clueId !== 'string' || clueId.trim() === '') {
    const error = new Error('clueId must be a non-empty string');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  // Validate sessionId is a valid ObjectId
  if (!OBJECT_ID_REGEX.test(sessionId)) {
    const error = new Error('sessionId must be a valid ObjectId');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  // Validate clueId is a valid ObjectId
  if (!OBJECT_ID_REGEX.test(clueId)) {
    const error = new Error('clueId must be a valid ObjectId');
    error.code = 'VALIDATION_ERROR';
    return next(error);
  }

  next();
}

module.exports = {
  validateArContent,
  validateNearbyQuery,
  validateObjectId,
  validateSessionBody,
  validateProgressBody
};
