import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { bookingRepository, equipmentRepository, tenantRepository } from '../lib/repositories.js';
import { AppError } from '../lib/errors.js';
import {
  storefrontAvailabilityQuerySchema,
  storefrontEquipmentParamsSchema,
  storefrontParamsSchema
} from '../validators/storefront.js';

export const storefrontRouter = Router();

storefrontRouter.get('/:slug/catalog', asyncHandler(async (req, res) => {
  const params = storefrontParamsSchema.parse(req.params);
  const tenant = await tenantRepository.getPublicBySlug(params.slug);
  const equipment = await equipmentRepository.list(tenant.id);
  res.json({ data: equipment });
}));

storefrontRouter.get('/:slug/catalog/:equipmentId', asyncHandler(async (req, res) => {
  const params = storefrontEquipmentParamsSchema.parse(req.params);
  const tenant = await tenantRepository.getPublicBySlug(params.slug);
  const equipment = await equipmentRepository.list(tenant.id);
  const item = equipment.find((entry) => entry.id === params.equipmentId);

  if (!item) {
    throw new AppError(404, 'Equipment not found', 'EQUIPMENT_NOT_FOUND');
  }

  res.json({ data: item });
}));

storefrontRouter.get('/:slug/catalog/:equipmentId/availability', asyncHandler(async (req, res) => {
  const params = storefrontEquipmentParamsSchema.parse(req.params);
  const query = storefrontAvailabilityQuerySchema.parse(req.query);
  const tenant = await tenantRepository.getPublicBySlug(params.slug);
  await equipmentRepository.getById(tenant.id, params.equipmentId);

  const data = await bookingRepository.listCalendar(tenant.id, {
    equipmentId: params.equipmentId,
    start: query.start,
    end: query.end
  });

  res.json({ data });
}));
