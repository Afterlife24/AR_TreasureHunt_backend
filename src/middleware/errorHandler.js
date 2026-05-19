/**
 * Global error handler middleware.
 * Formats all errors into a consistent JSON response structure.
 */
function errorHandler(err, req, res, next) {
  const statusMap = {
    VALIDATION_ERROR: 400,
    NOT_FOUND: 404,
    UPLOAD_ERROR: 500,
    DATABASE_ERROR: 500
  };

  const code = err.code || 'INTERNAL_ERROR';
  const status = statusMap[code] || 500;
  const message = err.message || 'An unexpected error occurred';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(status).json({
    error: {
      code,
      message,
      details: err.details || undefined
    }
  });
}

module.exports = errorHandler;
