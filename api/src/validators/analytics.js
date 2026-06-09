import { z } from 'zod';

export const analyticsDateRangeSchema = z
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

export const bookingVolumeQuerySchema = analyticsDateRangeSchema.extend({
  granularity: z.enum(['week', 'month']).optional().default('month')
});
