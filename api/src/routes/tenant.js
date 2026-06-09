import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { tenantRepository } from '../lib/repositories.js';
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

tenantRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const tenant = await tenantRepository.getById(req.user.tenant_id);
  res.json({ tenant });
}));

tenantRouter.get('/:slug/public', asyncHandler(async (req, res) => {
  const tenant = await tenantRepository.getPublicBySlug(req.params.slug);
  res.json({ tenant });
}));

tenantRouter.patch('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const payload = updateTenantBrandingSchema.parse(req.body);
  const tenant = await tenantRepository.updateBranding(req.user.tenant_id, payload);
  res.json({ tenant });
}));
