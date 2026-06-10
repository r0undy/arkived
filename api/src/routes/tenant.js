import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { equipmentRepository, isTenantPublished, tenantRepository } from '../lib/repositories.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { updateTenantBrandingSchema } from '../validators/tenant.js';
import { env } from '../config/env.js';

export const tenantRouter = Router();

tenantRouter.get('/public/tenants', asyncHandler(async (_req, res) => {
  if (env.nodeEnv === 'production') {
    return res.status(404).json({
      error: { message: 'Not found', code: 'NOT_FOUND' }
    });
  }

  const data = await tenantRepository.listPublicTenants();
  return res.json({ data });
}));

// Public directory of tenants for the marketing "trusted by" marquee. Returns
// only safe public fields (no contact info) and is available in all envs.
tenantRouter.get('/public/partners', asyncHandler(async (_req, res) => {
  const tenants = await tenantRepository.listPublicTenants();
  const data = tenants.map((tenant) => ({
    slug: tenant.slug,
    name: tenant.name,
    logo_url: tenant.logo_url || '',
    accent_color: tenant.accent_color || '#6366f1'
  }));
  return res.json({ data });
}));

tenantRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const tenant = await tenantRepository.getById(req.user.tenant_id);
  res.json({ tenant });
}));

tenantRouter.get('/:slug/public', asyncHandler(async (req, res) => {
  const tenant = await tenantRepository.getPublicBySlug(req.params.slug);
  const equipment = await equipmentRepository.list(tenant.id);
  const published = isTenantPublished(tenant, equipment.length);

  // Don't leak onboarding internals to the public; expose a single flag.
  const { onboarding_completed_steps, ...publicTenant } = tenant;
  res.json({ tenant: { ...publicTenant, is_published: published } });
}));

tenantRouter.patch('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const payload = updateTenantBrandingSchema.parse(req.body);
  const tenant = await tenantRepository.updateBranding(req.user.tenant_id, payload);
  res.json({ tenant });
}));
