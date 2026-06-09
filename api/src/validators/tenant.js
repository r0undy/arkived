import { z } from 'zod';
import { slugSchema } from './common.js';

const hexColorSchema = z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid 6-digit hex value');

export const registerTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  email: z.string().email(),
  password: z.string().min(8)
});

export const updateTenantBrandingSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    logo_url: z.string().url().optional().or(z.literal('')),
    accent_color: hexColorSchema.optional(),
    banner_image_url: z.string().url().optional().or(z.literal('')),
    contact_email: z.string().email().optional().or(z.literal('')),
    contact_phone: z.string().max(40).optional().or(z.literal('')),
    contact_address: z.string().max(240).optional().or(z.literal('')),
    show_watermark: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one branding field is required'
  });
