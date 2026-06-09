import { z } from 'zod';

export const storefrontParamsSchema = z.object({
  slug: z.string().min(2).max(120)
});

export const storefrontEquipmentParamsSchema = storefrontParamsSchema.extend({
  equipmentId: z.string().uuid()
});

export const storefrontAvailabilityQuerySchema = z
  .object({
    start: z.string().date().optional(),
    end: z.string().date().optional()
  })
  .refine((value) => {
    if (!value.start || !value.end) return true;
    return value.start <= value.end;
  }, {
    message: 'start must be on or before end',
    path: ['end']
  });
