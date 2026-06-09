import { z } from 'zod';

export const customerFiltersSchema = z.object({
  q: z.string().max(120).optional()
});

export const createCustomerSchema = z.object({
  full_name: z.string().min(2).max(160),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  notes: z.string().max(4000).optional().nullable()
});

export const updateCustomerSchema = createCustomerSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required'
);
