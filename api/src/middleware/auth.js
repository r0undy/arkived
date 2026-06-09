import { AppError } from '../lib/errors.js';

const parseDevHeader = (raw) => {
  if (!raw) return null;
  const [id, tenantId, role] = raw.split(':');
  if (!id || !tenantId || !role) return null;
  return { id, tenant_id: tenantId, role };
};

export const requireAuth = (req, _res, next) => {
  const devUser = parseDevHeader(req.header('x-dev-user'));
  if (devUser) {
    req.user = devUser;
    return next();
  }

  const authorization = req.header('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

  if (!token) {
    return next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
  }

  // Placeholder until Supabase JWT verification is wired.
  if (token === 'dev-admin-token') {
    req.user = {
      id: 'dev-admin',
      tenant_id: 'dev-tenant',
      role: 'tenant_admin'
    };
    return next();
  }

  return next(new AppError(401, 'Invalid token', 'INVALID_TOKEN'));
};
