import { AppError } from '../lib/errors.js';

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError(403, 'Forbidden', 'FORBIDDEN'));
  }

  return next();
};
