import { z } from 'zod';

export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(4000).optional().default(''),
  category: z.string().min(2).max(80),
  daily_rate: z.number().nonnegative(),
  deposit: z.number().nonnegative().optional().default(0),
  quantity: z.number().int().min(1).default(1),
  status: z.enum(['available', 'rented', 'maintenance', 'archived']).default('available'),
  condition: z.enum(['excellent', 'good', 'fair', 'needs_repair']).default('good'),
  tags: z.array(z.string()).optional().default([])
});
