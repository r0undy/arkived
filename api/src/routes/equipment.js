import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { equipmentRepository } from '../lib/repositories.js';
import { requireAuth } from '../middleware/auth.js';
import { createEquipmentSchema } from '../validators/equipment.js';

export const equipmentRouter = Router();

equipmentRouter.use(requireAuth);

equipmentRouter.get('/', asyncHandler(async (req, res) => {
  const items = await equipmentRepository.list(req.user.tenant_id);
  res.json({ data: items });
}));

equipmentRouter.post('/', asyncHandler(async (req, res) => {
  const payload = createEquipmentSchema.parse(req.body);
  const item = await equipmentRepository.create({ ...payload, tenant_id: req.user.tenant_id });
  res.status(201).json({ data: item });
}));
