import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { bookingRepository } from '../lib/repositories.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  bookingCalendarQuerySchema,
  bookingStatusUpdateSchema,
  createBookingSchema
} from '../validators/booking.js';

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.get('/', asyncHandler(async (req, res) => {
  const bookings = await bookingRepository.list(req.user.tenant_id);
  res.json({ data: bookings });
}));

bookingsRouter.get('/calendar', asyncHandler(async (req, res) => {
  const filters = bookingCalendarQuerySchema.parse(req.query);
  const data = await bookingRepository.listCalendar(req.user.tenant_id, {
    start: filters.start,
    end: filters.end,
    equipmentId: filters.equipment_id
  });

  res.json({ data });
}));

bookingsRouter.post('/', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const payload = createBookingSchema.parse(req.body);

  const hasOverlap = await bookingRepository.hasDateOverlap(
    req.user.tenant_id,
    payload.equipment_id,
    payload.start_date,
    payload.end_date
  );

  if (hasOverlap) {
    throw new AppError(
      409,
      'Booking overlaps with an existing active booking for this equipment',
      'BOOKING_CONFLICT'
    );
  }

  const booking = await bookingRepository.create({ ...payload, tenant_id: req.user.tenant_id });
  res.status(201).json({ data: booking });
}));

const ALLOWED_TRANSITIONS = {
  reserved: ['payment'],
  payment: ['dispatched'],
  dispatched: ['returned'],
  returned: ['inspected'],
  inspected: ['closed'],
  closed: []
};

bookingsRouter.patch('/:id/status', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const { status } = bookingStatusUpdateSchema.parse(req.body);
  const booking = await bookingRepository.getById(req.user.tenant_id, req.params.id);

  if (!ALLOWED_TRANSITIONS[booking.status]?.includes(status)) {
    throw new AppError(
      400,
      `Invalid booking transition from ${booking.status} to ${status}`,
      'INVALID_BOOKING_TRANSITION'
    );
  }

  const updated = await bookingRepository.updateStatus(req.user.tenant_id, req.params.id, status);
  res.json({ data: updated });
}));
