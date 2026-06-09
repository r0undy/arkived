export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: {
      message: err.message || 'Unexpected server error',
      code
    }
  });
};
