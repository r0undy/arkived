import { z } from 'zod';

export const createBookingSchema = z.object({
  equipment_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  start_date: z.string().date(),
  end_date: z.string().date(),
  total_amount: z.number().nonnegative(),
  status: z
    .enum(['reserved', 'payment', 'dispatched', 'returned', 'inspected', 'closed'])
    .default('reserved'),
  deposit_paid: z.boolean().optional().default(false),
  payment_reference: z.string().max(160).optional().nullable()
});
