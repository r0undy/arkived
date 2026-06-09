import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { equipmentRepository } from '../lib/repositories.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  createEquipmentSchema,
  equipmentFiltersSchema,
  updateEquipmentSchema
} from '../validators/equipment.js';

export const equipmentRouter = Router();

equipmentRouter.use(requireAuth);

equipmentRouter.get('/', asyncHandler(async (req, res) => {
  const filters = equipmentFiltersSchema.parse(req.query);
  const items = await equipmentRepository.list(req.user.tenant_id, filters);
  res.json({ data: items });
}));

equipmentRouter.get('/:id', asyncHandler(async (req, res) => {
  const item = await equipmentRepository.getById(req.user.tenant_id, req.params.id);
  res.json({ data: item });
}));

equipmentRouter.post('/', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const payload = createEquipmentSchema.parse(req.body);
  const item = await equipmentRepository.create({ ...payload, tenant_id: req.user.tenant_id });
  res.status(201).json({ data: item });
}));

equipmentRouter.patch('/:id', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const payload = updateEquipmentSchema.parse(req.body);
  const item = await equipmentRepository.update(req.user.tenant_id, req.params.id, payload);
  res.json({ data: item });
}));

equipmentRouter.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  await equipmentRepository.softDelete(req.user.tenant_id, req.params.id);
  res.status(204).send();
}));
