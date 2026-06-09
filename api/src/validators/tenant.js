import { z } from 'zod';
import { slugSchema } from './common.js';

export const registerTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  email: z.string().email(),
  password: z.string().min(8)
});
