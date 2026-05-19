const uploadService = require('../services/uploadService');
const cdnUrlGenerator = require('../services/cdnUrlGenerator');
const contentService = require('../services/contentService');

/**
 * Creates a new AR content document.
 * Handles file uploads to S3, CDN URL generation, and document persistence.
 */
async function create(req, res, next) {
  try {
    const parsedContent = req.parsedContent;
    const markerFile = req.files.markerImage[0];
    const clueRenderFile = req.files.clueRenderImage[0];

    // Generate S3 keys
    const markerKey = uploadService.generateS3Key('markers', markerFile.originalname);
    const clueRenderKey = uploadService.generateS3Key('clues', clueRenderFile.originalname);

    // Upload files to S3
    await uploadService.uploadFile(markerFile.buffer, markerKey, markerFile.mimetype);
    await uploadService.uploadFile(clueRenderFile.buffer, clueRenderKey, clueRenderFile.mimetype);

    // Generate CDN URLs
    const markerImageUrl = cdnUrlGenerator.generateUrl(markerKey);
    const clueRenderImageUrl = cdnUrlGenerator.generateUrl(clueRenderKey);

    // Build document data from parsed content
    const { latitude, longitude, id, ...rest } = parsedContent;

    const documentData = {
      ...rest,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      markerImageUrl,
      clueRenderImageUrl
    };

    const savedDoc = await contentService.create(documentData);

    res.status(201).json({ success: true, item: savedDoc });
  } catch (error) {
    next(error);
  }
}

/**
 * Finds AR content near a geographic point.
 */
async function getNearby(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radius = parseFloat(req.query.radius);

    const results = await contentService.findNearby(lat, lon, radius);

    res.status(200).json({ items: results });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets a single AR content document by ID.
 */
async function getById(req, res, next) {
  try {
    const doc = await contentService.findById(req.params.id);

    res.status(200).json({ item: doc });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft-deletes an AR content document.
 */
async function softDelete(req, res, next) {
  try {
    await contentService.softDelete(req.params.id);

    res.status(200).json({ success: true, message: 'AR content deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  getNearby,
  getById,
  softDelete
};
