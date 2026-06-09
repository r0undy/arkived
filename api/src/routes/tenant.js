import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { tenantRepository } from '../lib/repositories.js';

export const tenantRouter = Router();

tenantRouter.get('/:slug/public', asyncHandler(async (req, res) => {
  const tenant = await tenantRepository.getPublicBySlug(req.params.slug);
  res.json({ tenant });
}));
