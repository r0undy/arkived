import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { registerTenantSchema } from '../validators/tenant.js';
import { turnstileVerifySchema } from '../validators/auth.js';
import { tenantRepository } from '../lib/repositories.js';
import { hasSupabase, supabase } from '../config/supabase.js';
import { AppError } from '../lib/errors.js';
import { verifyTurnstileToken } from '../lib/turnstile.js';
import { env } from '../config/env.js';

export const authRouter = Router();

authRouter.post('/turnstile/verify', asyncHandler(async (req, res) => {
  const payload = turnstileVerifySchema.parse(req.body);
  const result = await verifyTurnstileToken(payload.token, req.ip);

  if (!result.success) {
    throw new AppError(400, 'Captcha verification failed', 'TURNSTILE_VERIFICATION_FAILED');
  }

  res.json({ ok: true });
}));

authRouter.post('/register', asyncHandler(async (req, res) => {
  const payload = registerTenantSchema.parse(req.body);
  if (env.turnstileRequired) {
    if (!payload.turnstile_token) {
      throw new AppError(400, 'Captcha token is required', 'TURNSTILE_TOKEN_REQUIRED');
    }
    const verification = await verifyTurnstileToken(payload.turnstile_token, req.ip);
    if (!verification.success) {
      throw new AppError(400, 'Captcha verification failed', 'TURNSTILE_VERIFICATION_FAILED');
    }
  }

  const tenant = await tenantRepository.registerTenant(payload);

  if (hasSupabase) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true
    });

    if (authError || !authUser?.user) {
      await supabase.from('tenants').delete().eq('id', tenant.id);
      throw new AppError(400, authError?.message || 'Failed to create auth user', 'AUTH_USER_CREATE_FAILED');
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        tenant_id: tenant.id,
        role: 'admin',
        full_name: payload.name
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('tenants').delete().eq('id', tenant.id);
      throw new AppError(400, profileError.message, 'USER_PROFILE_CREATE_FAILED');
    }
  }

  res.status(201).json({
    tenant,
    message: 'Tenant registered successfully.'
  });
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({
    user: req.user
  });
}));
