import { Buffer } from 'node:buffer';
import { Router } from 'express';
import { hasSupabase, supabase } from '../config/supabase.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { bookingRepository, equipmentRepository } from '../lib/repositories.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  equipmentAvailabilityQuerySchema,
  createEquipmentImageSchema,
  createMaintenanceLogSchema,
  createEquipmentSchema,
  equipmentFiltersSchema,
  reorderEquipmentImagesSchema,
  updateMaintenanceLogSchema,
  updateEquipmentSchema
} from '../validators/equipment.js';

const safeExtension = (fileName, mimeType) => {
  const fromName = String(fileName || '').split('.').pop();
  if (fromName && fromName !== fileName && /^[a-z0-9]+$/i.test(fromName)) {
    return fromName.toLowerCase();
  }

  const fromMime = String(mimeType || '').split('/')[1] || 'png';
  return fromMime.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
};

export const equipmentRouter = Router();

equipmentRouter.use(requireAuth);

equipmentRouter.get('/', asyncHandler(async (req, res) => {
  const filters = equipmentFiltersSchema.parse(req.query);
  const items = await equipmentRepository.list(req.user.tenant_id, filters);
  res.json({ data: items });
}));

equipmentRouter.get('/:id/availability', asyncHandler(async (req, res) => {
  const query = equipmentAvailabilityQuerySchema.parse(req.query);
  await equipmentRepository.getById(req.user.tenant_id, req.params.id);

  const bookings = await bookingRepository.listCalendar(req.user.tenant_id, {
    start: query.from,
    end: query.to,
    equipmentId: req.params.id
  });

  const blockingStatuses = new Set(['reserved', 'payment', 'dispatched', 'returned', 'inspected']);
  const hasConflict = bookings.some((entry) => blockingStatuses.has(entry.status));

  res.json({
    data: {
      equipment_id: req.params.id,
      from: query.from,
      to: query.to,
      available: !hasConflict,
      booked_ranges: bookings.map((entry) => ({
        booking_id: entry.id,
        start_date: entry.start_date,
        end_date: entry.end_date,
        status: entry.status,
        overdue: Boolean(entry.overdue)
      }))
    }
  });
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

equipmentRouter.post('/:id/images', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const payload = createEquipmentImageSchema.parse(req.body);
  const ext = safeExtension(payload.file_name, payload.mime_type);
  let storageUrl = '';

  if (hasSupabase) {
    const binary = Buffer.from(payload.content_base64, 'base64');
    if (!binary.length) {
      throw new AppError(400, 'content_base64 is empty or invalid', 'INVALID_IMAGE_CONTENT');
    }

    const objectPath = `${req.user.tenant_id}/equipment/${req.params.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bucket = supabase.storage.from('tenant-assets');

    const { error: uploadError } = await bucket.upload(objectPath, binary, {
      contentType: payload.mime_type,
      upsert: false,
      cacheControl: '3600'
    });

    if (uploadError) {
      throw new AppError(400, uploadError.message, 'EQUIPMENT_IMAGE_UPLOAD_FAILED');
    }

    const { data: publicData } = bucket.getPublicUrl(objectPath);
    storageUrl = publicData?.publicUrl || '';

    if (!storageUrl) {
      throw new AppError(500, 'Failed to resolve uploaded image URL', 'EQUIPMENT_IMAGE_URL_FAILED');
    }
  } else {
    storageUrl = `memory://tenant-assets/${req.user.tenant_id}/equipment/${req.params.id}/${Date.now()}.${ext}`;
  }

  const image = await equipmentRepository.addImage(req.user.tenant_id, req.params.id, {
    storage_url: storageUrl,
    is_primary: payload.is_primary,
    display_order: payload.display_order
  });

  res.status(201).json({ data: image });
}));

equipmentRouter.delete('/:id/images/:imageId', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  await equipmentRepository.removeImage(req.user.tenant_id, req.params.id, req.params.imageId);
  res.status(204).send();
}));

equipmentRouter.patch('/:id/images/:imageId/primary', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const image = await equipmentRepository.setPrimaryImage(req.user.tenant_id, req.params.id, req.params.imageId);
  res.json({ data: image });
}));

equipmentRouter.patch('/:id/images/reorder', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const payload = reorderEquipmentImagesSchema.parse(req.body);
  const data = await equipmentRepository.reorderImages(req.user.tenant_id, req.params.id, payload.image_ids);
  res.json({ data });
}));

equipmentRouter.get('/:id/maintenance', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  await equipmentRepository.getById(req.user.tenant_id, req.params.id);
  const data = await equipmentRepository.listMaintenanceLogs(req.user.tenant_id, req.params.id);
  res.json({ data });
}));

equipmentRouter.post('/:id/maintenance', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const payload = createMaintenanceLogSchema.parse(req.body);
  await equipmentRepository.getById(req.user.tenant_id, req.params.id);
  const data = await equipmentRepository.createMaintenanceLog({
    ...payload,
    tenant_id: req.user.tenant_id,
    equipment_id: req.params.id
  });

  res.status(201).json({ data });
}));

equipmentRouter.patch('/:id/maintenance/:logId', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  const payload = updateMaintenanceLogSchema.parse(req.body);
  const data = await equipmentRepository.updateMaintenanceLog(
    req.user.tenant_id,
    req.params.id,
    req.params.logId,
    payload
  );

  res.json({ data });
}));

equipmentRouter.delete('/:id/maintenance/:logId', requireRole('admin', 'staff'), asyncHandler(async (req, res) => {
  await equipmentRepository.deleteMaintenanceLog(req.user.tenant_id, req.params.id, req.params.logId);
  res.status(204).send();
}));
