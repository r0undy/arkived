import { ZodError } from 'zod';

export const errorHandler = (err, _req, res, _next) => {
  const isValidation = err instanceof ZodError;
  const statusCode = isValidation ? 400 : (err.statusCode || 500);
  const code = isValidation ? 'VALIDATION_ERROR' : (err.code || 'INTERNAL_ERROR');
  const isProd = process.env.NODE_ENV === 'production';

  const validationMessage = isValidation
    ? err.issues?.[0]?.message || 'Invalid request payload'
    : '';
  const message = isValidation
    ? validationMessage
    : (statusCode >= 500 && isProd ? 'Unexpected server error' : (err.message || 'Unexpected server error'));

  res.status(statusCode).json({
    error: {
      message,
      code,
      ...(isValidation ? { details: err.flatten() } : {})
    }
  });
};
