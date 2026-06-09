import { Router } from 'express';
import { hasSupabase, supabase } from '../config/supabase.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { inMemoryDb } from '../lib/inMemoryDb.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('platform_owner'));

adminRouter.get('/tenants', asyncHandler(async (_req, res) => {
  if (!hasSupabase) {
    const data = inMemoryDb
      .listTenants()
      .map((tenant) => ({
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        signup_date: tenant.created_at,
        status: 'active'
      }))
      .sort((a, b) => String(b.signup_date).localeCompare(String(a.signup_date)));

    res.json({ data });
    return;
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, created_at, onboarding_completed_steps')
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message, 'ADMIN_TENANT_LIST_FAILED');
  }

  res.json({
    data: (data || []).map((tenant) => ({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      signup_date: tenant.created_at,
      status: Array.isArray(tenant.onboarding_completed_steps) && tenant.onboarding_completed_steps.length > 0
        ? 'active'
        : 'onboarding'
    }))
  });
}));

adminRouter.get('/overview', asyncHandler(async (_req, res) => {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString();

  if (!hasSupabase) {
    const tenants = inMemoryDb.listTenants();
    const bookings = inMemoryDb.listAllBookings();

    const totalTenants = tenants.length;
    const newMTD = tenants.filter((entry) => String(entry.created_at) >= monthStartIso).length;
    const totalBookings = bookings.length;

    res.json({
      data: {
        totalTenants,
        newMTD,
        totalBookings,
        churnRate: 0
      }
    });
    return;
  }

  const [
    totalTenantsResult,
    newMtdResult,
    totalBookingsResult
  ] = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact', head: true }),
    supabase.from('tenants').select('id', { count: 'exact', head: true }).gte('created_at', monthStartIso),
    supabase.from('bookings').select('id', { count: 'exact', head: true })
  ]);

  if (totalTenantsResult.error || newMtdResult.error || totalBookingsResult.error) {
    throw new AppError(
      500,
      totalTenantsResult.error?.message
        || newMtdResult.error?.message
        || totalBookingsResult.error?.message
        || 'Failed to load admin overview',
      'ADMIN_OVERVIEW_FAILED'
    );
  }

  res.json({
    data: {
      totalTenants: Number(totalTenantsResult.count || 0),
      newMTD: Number(newMtdResult.count || 0),
      totalBookings: Number(totalBookingsResult.count || 0),
      churnRate: 0
    }
  });
}));
