import { hasSupabase, supabase } from '../config/supabase.js';
import { AppError } from '../lib/errors.js';
import { inMemoryDb } from '../lib/inMemoryDb.js';

const parseDevHeader = (raw) => {
  if (!raw) return null;
  const [id, tenantId, role] = raw.split(':');
  if (!id || !tenantId || !role) return null;
  return { id, tenant_id: tenantId, role };
};

const normalizeRole = (role) => {
  if (!role) return 'staff';
  if (role === 'tenant_admin') return 'admin';
  if (role === 'tenant_staff') return 'staff';
  return role;
};

const unauthorized = (message = 'Unauthorized', code = 'UNAUTHORIZED') =>
  new AppError(401, message, code);

export const requireAuth = async (req, _res, next) => {
  try {
    const devUser = parseDevHeader(req.header('x-dev-user'));
    if (devUser) {
      req.user = { ...devUser, role: normalizeRole(devUser.role) };
      return next();
    }

    const authorization = req.header('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

    if (!token) {
      return next(unauthorized());
    }

    if (!hasSupabase) {
      if (token !== 'dev-admin-token') {
        return next(unauthorized('Invalid token', 'INVALID_TOKEN'));
      }

      const [demoTenant] = inMemoryDb.listTenants();
      req.user = {
        id: 'dev-admin',
        tenant_id: demoTenant?.id || 'dev-tenant',
        role: 'admin'
      };

      return next();
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return next(unauthorized('Invalid authentication session', 'INVALID_TOKEN'));
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return next(new AppError(403, 'User profile not registered', 'PROFILE_NOT_FOUND'));
    }

    req.user = {
      id: user.id,
      tenant_id: profile.tenant_id,
      role: normalizeRole(profile.role)
    };

    return next();
  } catch (error) {
    return next(error);
  }
};
