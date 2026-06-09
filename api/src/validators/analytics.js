import { z } from 'zod';

const analyticsDateRangeShape = {
  start: z.string().date().optional(),
  end: z.string().date().optional()
};

const withOrderedDates = (schema) => schema.refine((value) => {
    if (!value.start || !value.end) return true;
    return value.start <= value.end;
  }, {
    message: 'start must be on or before end',
    path: ['end']
  });

export const analyticsDateRangeSchema = withOrderedDates(z.object(analyticsDateRangeShape));

export const bookingVolumeQuerySchema = withOrderedDates(z.object({
  ...analyticsDateRangeShape,
  granularity: z.enum(['week', 'month']).optional().default('month')
}));
