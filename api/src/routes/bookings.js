import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { bookingRepository } from '../lib/repositories.js';
import { requireAuth } from '../middleware/auth.js';
import { createBookingSchema } from '../validators/booking.js';

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.get('/', asyncHandler(async (req, res) => {
  const bookings = await bookingRepository.list(req.user.tenant_id);
  res.json({ data: bookings });
}));

bookingsRouter.post('/', asyncHandler(async (req, res) => {
  const payload = createBookingSchema.parse(req.body);
  const booking = await bookingRepository.create({ ...payload, tenant_id: req.user.tenant_id });
  res.status(201).json({ data: booking });
}));
