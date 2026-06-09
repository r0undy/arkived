import { z } from 'zod';

export const equipmentStatusSchema = z.enum(['available', 'rented', 'maintenance', 'archived']);
export const equipmentConditionSchema = z.enum(['excellent', 'good', 'fair', 'needs_repair']);

export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(4000).optional().default(''),
  category: z.string().min(2).max(80),
  daily_rate: z.number().nonnegative(),
  deposit: z.number().nonnegative().optional().default(0),
  quantity: z.number().int().min(1).default(1),
  status: equipmentStatusSchema.default('available'),
  condition: equipmentConditionSchema.default('good'),
  tags: z.array(z.string()).optional().default([])
});

export const updateEquipmentSchema = createEquipmentSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required'
);

export const equipmentFiltersSchema = z.object({
  category: z.string().min(2).max(80).optional(),
  status: equipmentStatusSchema.optional(),
  q: z.string().max(120).optional()
});

export const equipmentAvailabilityQuerySchema = z
  .object({
    from: z.string().date(),
    to: z.string().date()
  })
  .refine((value) => value.from <= value.to, {
    message: 'from must be on or before to',
    path: ['to']
  });

export const createEquipmentImageSchema = z.object({
  file_name: z.string().min(1).max(140),
  mime_type: z.string().regex(/^image\/[a-z0-9.+-]+$/i, 'mime_type must be an image/* value'),
  content_base64: z.string().min(16),
  is_primary: z.boolean().optional().default(false),
  display_order: z.number().int().min(0).optional()
});

export const reorderEquipmentImagesSchema = z.object({
  image_ids: z.array(z.string().uuid()).min(1)
});

const maintenanceTypeSchema = z.enum(['routine', 'repair', 'inspection', 'cleaning']);

export const createMaintenanceLogSchema = z.object({
  service_date: z.string().date(),
  service_type: maintenanceTypeSchema,
  performed_by: z.string().max(120).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  cost: z.number().nonnegative().optional().nullable(),
  next_service_due: z.string().date().optional().nullable()
});

export const updateMaintenanceLogSchema = createMaintenanceLogSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required'
);
