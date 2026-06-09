import crypto from 'node:crypto';
import { Router } from 'express';
import { hasSupabase, supabase } from '../config/supabase.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { staffRepository } from '../lib/repositories.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { inviteStaffSchema, updateStaffRoleSchema } from '../validators/staff.js';

export const staffRouter = Router();

staffRouter.use(requireAuth, requireRole('admin'));

staffRouter.get('/', asyncHandler(async (req, res) => {
  const data = await staffRepository.listByTenant(req.user.tenant_id);
  res.json({ data });
}));

staffRouter.post('/invite', asyncHandler(async (req, res) => {
  const payload = inviteStaffSchema.parse(req.body);

  if (!hasSupabase) {
    const user = await staffRepository.create({
      id: crypto.randomUUID(),
      tenant_id: req.user.tenant_id,
      role: payload.role,
      full_name: payload.full_name || payload.email.split('@')[0],
      email: payload.email
    });

    return res.status(201).json({
      data: user,
      message: 'Staff user created in local dev mode (no invite email sent).'
    });
  }

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(payload.email);

  let invitedUser = inviteData?.user || null;
  if (inviteError || !invitedUser) {
    const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: crypto.randomBytes(12).toString('base64url'),
      email_confirm: false
    });

    if (createError || !createdData?.user) {
      throw new AppError(400, createError?.message || inviteError?.message || 'Failed to invite staff user', 'STAFF_INVITE_FAILED');
    }

    invitedUser = createdData.user;
  }

  const user = await staffRepository.create({
    id: invitedUser.id,
    tenant_id: req.user.tenant_id,
    role: payload.role,
    full_name: payload.full_name || payload.email.split('@')[0],
    email: payload.email
  });

  return res.status(201).json({
    data: user,
    message: 'Staff invite processed successfully.'
  });
}));

staffRouter.patch('/:id/role', asyncHandler(async (req, res) => {
  const payload = updateStaffRoleSchema.parse(req.body);

  const data = await staffRepository.updateRole(req.user.tenant_id, req.params.id, payload.role);
  res.json({ data });
}));

staffRouter.delete('/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError(400, 'You cannot remove your own admin account', 'STAFF_SELF_DELETE_BLOCKED');
  }

  await staffRepository.deleteById(req.user.tenant_id, req.params.id);

  if (hasSupabase) {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) {
      throw new AppError(500, error.message, 'STAFF_AUTH_DELETE_FAILED');
    }
  }

  res.status(204).send();
}));
