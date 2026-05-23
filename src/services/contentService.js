const ArContent = require('../models/ArContent');

/**
 * Creates a new AR content document.
 * @param {object} contentData - The content data to store
 * @returns {Promise<object>} The created document
 */
async function create(contentData) {
  try {
    const doc = new ArContent(contentData);
    return await doc.save();
  } catch (err) {
    const error = new Error(`Failed to create AR content: ${err.message}`);
    error.code = 'DATABASE_ERROR';
    throw error;
  }
}

/**
 * Finds all AR content documents (excludes soft-deleted).
 * @returns {Promise<object[]>} Array of all AR content documents
 */
async function findAll() {
  try {
    return await ArContent.find({ isDeleted: false }).sort({ createdAt: -1 });
  } catch (err) {
    const error = new Error(`Failed to fetch AR content: ${err.message}`);
    error.code = 'DATABASE_ERROR';
    throw error;
  }
}

/**
 * Finds AR content documents near a geographic point.
 * @param {number} lat - Latitude of the center point
 * @param {number} lon - Longitude of the center point
 * @param {number} radiusMeters - Search radius in meters
 * @returns {Promise<object[]>} Array of nearby AR content documents
 */
async function findNearby(lat, lon, radiusMeters) {
  try {
    return await ArContent.find({
      isDeleted: false,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          $maxDistance: radiusMeters
        }
      }
    });
  } catch (err) {
    const error = new Error(`Failed to query nearby content: ${err.message}`);
    error.code = 'DATABASE_ERROR';
    throw error;
  }
}

/**
 * Finds an AR content document by ID (excludes soft-deleted).
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<object|null>} The document or null if not found/deleted
 */
async function findById(id) {
  try {
    const doc = await ArContent.findOne({ _id: id, isDeleted: false });
    if (!doc) {
      const error = new Error('AR content not found');
      error.code = 'NOT_FOUND';
      throw error;
    }
    return doc;
  } catch (err) {
    if (err.code === 'NOT_FOUND') throw err;
    const error = new Error(`Failed to find AR content: ${err.message}`);
    error.code = 'DATABASE_ERROR';
    throw error;
  }
}

/**
 * Soft-deletes an AR content document by setting isDeleted to true.
 * Returns null if the document is not found or already deleted.
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<object|null>} The updated document or null
 */
async function softDelete(id) {
  try {
    const doc = await ArContent.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!doc) {
      const error = new Error('AR content not found or already deleted');
      error.code = 'NOT_FOUND';
      throw error;
    }
    return doc;
  } catch (err) {
    if (err.code === 'NOT_FOUND') throw err;
    const error = new Error(`Failed to soft-delete AR content: ${err.message}`);
    error.code = 'DATABASE_ERROR';
    throw error;
  }
}

module.exports = {
  create,
  findAll,
  findNearby,
  findById,
  softDelete
};
