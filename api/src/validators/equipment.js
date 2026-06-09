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
