import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { customerRepository } from '../lib/repositories.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  createCustomerSchema,
  customerFiltersSchema,
  updateCustomerSchema
} from '../validators/customers.js';

export const customersRouter = Router();

customersRouter.use(requireAuth, requireRole('admin', 'staff'));

customersRouter.get('/', asyncHandler(async (req, res) => {
  const filters = customerFiltersSchema.parse(req.query);
  const data = await customerRepository.list(req.user.tenant_id, filters);
  res.json({ data });
}));

customersRouter.post('/', asyncHandler(async (req, res) => {
  const payload = createCustomerSchema.parse(req.body);
  const data = await customerRepository.create({ ...payload, tenant_id: req.user.tenant_id });
  res.status(201).json({ data });
}));

customersRouter.patch('/:id', asyncHandler(async (req, res) => {
  const payload = updateCustomerSchema.parse(req.body);
  const data = await customerRepository.update(req.user.tenant_id, req.params.id, payload);
  res.json({ data });
}));

customersRouter.get('/:id/bookings', asyncHandler(async (req, res) => {
  const data = await customerRepository.listBookings(req.user.tenant_id, req.params.id);
  res.json({ data });
}));
