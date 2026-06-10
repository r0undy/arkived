import { z } from 'zod';
import { slugSchema } from './common.js';

const hexColorSchema = z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid 6-digit hex value');

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM (24-hour)');
const dayHoursSchema = z
  .object({ open: timeSchema, close: timeSchema })
  .strict()
  .nullable();
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const businessHoursSchema = z
  .object(Object.fromEntries(DAY_KEYS.map((key) => [key, dayHoursSchema.optional()])))
  .strict();

const onboardingStepSchema = z.enum([
  'upload_logo',
  'set_accent_color',
  'add_first_equipment',
  'set_contact_details',
  'invite_team_member',
  'share_storefront'
]);

export const registerTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  email: z.string().email(),
  password: z.string().min(8),
  turnstile_token: z.string().min(1).optional()
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
    show_watermark: z.boolean().optional(),
    tagline: z.string().max(160).optional().or(z.literal('')),
    meta_description: z.string().max(300).optional().or(z.literal('')),
    favicon_url: z.string().url().optional().or(z.literal('')),
    og_image_url: z.string().url().optional().or(z.literal('')),
    business_hours: businessHoursSchema.nullable().optional(),
    onboarding_completed_steps: z.array(onboardingStepSchema).max(8).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one branding field is required'
  });
