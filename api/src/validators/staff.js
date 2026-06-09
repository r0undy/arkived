import { z } from 'zod';

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(120).optional(),
  role: z.enum(['admin', 'staff']).default('staff')
});

export const updateStaffRoleSchema = z.object({
  role: z.enum(['admin', 'staff'])
});
