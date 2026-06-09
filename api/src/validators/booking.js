import { z } from 'zod';

export const bookingStatusSchema = z.enum([
  'reserved',
  'payment',
  'dispatched',
  'returned',
  'inspected',
  'closed'
]);

export const createBookingSchema = z
  .object({
    equipment_id: z.string().uuid(),
    customer_id: z.string().uuid(),
    start_date: z.string().date(),
    end_date: z.string().date(),
    total_amount: z.number().nonnegative(),
    status: bookingStatusSchema.default('reserved'),
    deposit_paid: z.boolean().optional().default(false),
    payment_reference: z.string().max(160).optional().nullable()
  })
  .refine((value) => value.start_date <= value.end_date, {
    message: 'start_date must be on or before end_date',
    path: ['end_date']
  });

export const bookingStatusUpdateSchema = z.object({
  status: bookingStatusSchema
});

export const bookingCalendarQuerySchema = z
  .object({
    start: z.string().date().optional(),
    end: z.string().date().optional(),
    equipment_id: z.string().uuid().optional()
  })
  .refine((value) => {
    if (!value.start || !value.end) return true;
    return value.start <= value.end;
  }, {
    message: 'start must be on or before end',
    path: ['end']
  });
