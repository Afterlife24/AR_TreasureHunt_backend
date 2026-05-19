const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const s3Client = new S3Client({
  region: process.env.AWS_REGION
});

/**
 * Generates a unique S3 key for a file upload.
 * Format: {prefix}/{uuid}-{timestamp}.{ext}
 */
function generateS3Key(prefix, originalName) {
  const ext = path.extname(originalName).slice(1);
  const timestamp = Date.now();
  const id = uuidv4();
  return `${prefix}/${id}-${timestamp}.${ext}`;
}

/**
 * Uploads a buffer to S3.
 * @param {Buffer} buffer - File content
 * @param {string} key - S3 object key
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} The S3 object key
 */
async function uploadFile(buffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });

  try {
    await s3Client.send(command);
    return key;
  } catch (err) {
    const error = new Error(`Failed to upload file to S3: ${err.message}`);
    error.code = 'UPLOAD_ERROR';
    throw error;
  }
}

module.exports = {
  uploadFile,
  generateS3Key
};
