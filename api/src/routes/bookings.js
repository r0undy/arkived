import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { notify } from '../lib/notify.js';
import { bookingRepository, customerRepository, equipmentRepository, tenantRepository } from '../lib/repositories.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  bookingListQuerySchema,
  bookingCalendarQuerySchema,
  bookingMutableUpdateSchema,
  publicBookingInquirySchema,
  bookingStatusUpdateSchema,
  createBookingSchema
} from '../validators/booking.js';

export const bookingsRouter = Router();

bookingsRouter.post('/inquiry', asyncHandler(async (req, res) => {
  const payload = publicBookingInquirySchema.parse(req.body);
  const tenant = await tenantRepository.getPublicBySlug(payload.tenant_slug);
  await equipmentRepository.getById(tenant.id, payload.equipment_id);

  const hasOverlap = await bookingRepository.hasDateOverlap(
    tenant.id,
    payload.equipment_id,
    payload.start_date,
    payload.end_date
  );

  if (hasOverlap) {
    throw new AppError(
      409,
      'Selected date range is unavailable for this equipment',
      'BOOKING_CONFLICT'
    );
  }

  const existing = await customerRepository.list(tenant.id, { q: payload.email });
  const matched = existing.find((entry) => String(entry.email || '').toLowerCase() === payload.email.toLowerCase());
  const customer = matched || await customerRepository.create({
    tenant_id: tenant.id,
    full_name: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    notes: payload.message || null
  });

  const booking = await bookingRepository.create({
    tenant_id: tenant.id,
    equipment_id: payload.equipment_id,
    customer_id: customer.id,
    start_date: payload.start_date,
    end_date: payload.end_date,
    status: 'reserved',
    total_amount: 0,
    deposit_paid: false,
    payment_reference: null
  });

  res.status(201).json({ data: booking });
}));

bookingsRouter.use(requireAuth);

bookingsRouter.get('/', asyncHandler(async (req, res) => {
  const query = bookingListQuerySchema.parse(req.query);
  const bookings = await bookingRepository.list(req.user.tenant_id, {
    status: query.status,
    start: query.start,
    end: query.end,
    equipmentId: query.equipment_id,
    customerId: query.customer_id
  });

  const offset = (query.page - 1) * query.limit;
  const paged = bookings.slice(offset, offset + query.limit);

  res.json({
    data: paged,
    meta: {
      page: query.page,
      limit: query.limit,
      total: bookings.length,
      total_pages: Math.max(1, Math.ceil(bookings.length / query.limit))
    }
  });
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

bookingsRouter.get('/:id', asyncHandler(async (req, res) => {
  const booking = await bookingRepository.getById(req.user.tenant_id, req.params.id);
  res.json({ data: booking });
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
  await notify.bookingStatusChanged({
    tenant_id: req.user.tenant_id,
    booking_id: updated.id,
    previous_status: booking.status,
    next_status: status
  });
  res.json({ data: updated });
}));

bookingsRouter.patch('/:id', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const payload = bookingMutableUpdateSchema.parse(req.body);
  const updated = await bookingRepository.update(req.user.tenant_id, req.params.id, payload);
  res.json({ data: updated });
}));
