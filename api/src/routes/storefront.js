import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { bookingRepository, equipmentRepository, tenantRepository } from '../lib/repositories.js';
import { AppError } from '../lib/errors.js';

export const storefrontRouter = Router();

storefrontRouter.get('/:slug/catalog', asyncHandler(async (req, res) => {
  const tenant = await tenantRepository.getPublicBySlug(req.params.slug);
  const equipment = await equipmentRepository.list(tenant.id);
  res.json({ data: equipment });
}));

storefrontRouter.get('/:slug/catalog/:equipmentId', asyncHandler(async (req, res) => {
  const tenant = await tenantRepository.getPublicBySlug(req.params.slug);
  const equipment = await equipmentRepository.list(tenant.id);
  const item = equipment.find((entry) => entry.id === req.params.equipmentId);

  if (!item) {
    throw new AppError(404, 'Equipment not found', 'EQUIPMENT_NOT_FOUND');
  }

  res.json({ data: item });
}));

storefrontRouter.get('/:slug/catalog/:equipmentId/availability', asyncHandler(async (req, res) => {
  const tenant = await tenantRepository.getPublicBySlug(req.params.slug);
  await equipmentRepository.getById(tenant.id, req.params.equipmentId);

  const start = typeof req.query.start === 'string' ? req.query.start : undefined;
  const end = typeof req.query.end === 'string' ? req.query.end : undefined;

  const data = await bookingRepository.listCalendar(tenant.id, {
    equipmentId: req.params.equipmentId,
    start,
    end
  });

  res.json({ data });
}));
