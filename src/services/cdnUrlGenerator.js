/**
 * Generates a CDN URL for a given S3 key.
 * @param {string} s3Key - The S3 object key
 * @returns {string} The full CloudFront CDN URL
 */
function generateUrl(s3Key) {
  const domain = process.env.CLOUDFRONT_DOMAIN;
  return `https://${domain}/${s3Key}`;
}

module.exports = {
  generateUrl
};
