import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { bookingRepository, customerRepository, equipmentRepository, tenantRepository } from '../lib/repositories.js';
import { AppError } from '../lib/errors.js';
import {
  storefrontAvailabilityQuerySchema,
  storefrontEquipmentParamsSchema,
  storefrontParamsSchema,
  storefrontTrackQuerySchema
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

// Public, read-only booking status lookup for the storefront "track your request"
// page. Requires both the unguessable booking reference (UUID) AND the matching
// customer email; any miss returns a generic 404 to prevent enumeration.
storefrontRouter.get('/:slug/track', asyncHandler(async (req, res) => {
  const params = storefrontParamsSchema.parse(req.params);
  const query = storefrontTrackQuerySchema.parse(req.query);
  const tenant = await tenantRepository.getPublicBySlug(params.slug);

  const notFound = new AppError(404, 'No matching request found. Check your reference and email.', 'TRACKING_NOT_FOUND');

  let booking;
  try {
    booking = await bookingRepository.getById(tenant.id, query.reference);
  } catch (_error) {
    throw notFound;
  }

  let customer;
  try {
    customer = await customerRepository.getById(tenant.id, booking.customer_id);
  } catch (_error) {
    throw notFound;
  }

  if (String(customer.email || '').toLowerCase() !== query.email.toLowerCase()) {
    throw notFound;
  }

  let equipmentName = '';
  try {
    const item = await equipmentRepository.getById(tenant.id, booking.equipment_id);
    equipmentName = item?.name || '';
  } catch (_error) {
    // Equipment may have been archived; status tracking still works without the name.
  }

  res.json({
    data: {
      reference: booking.id,
      status: booking.status,
      start_date: booking.start_date,
      end_date: booking.end_date,
      equipment_name: equipmentName,
      created_at: booking.created_at
    }
  });
}));
