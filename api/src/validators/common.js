import { z } from 'zod';

export const idSchema = z.string().uuid();

export const slugSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only');
