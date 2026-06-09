import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { registerTenantSchema } from '../validators/tenant.js';
import { tenantRepository } from '../lib/repositories.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(async (req, res) => {
  const payload = registerTenantSchema.parse(req.body);
  const tenant = await tenantRepository.registerTenant(payload);

  res.status(201).json({
    tenant,
    message: 'Tenant registered. Wire Supabase Auth user creation in production.'
  });
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({
    user: req.user
  });
}));
