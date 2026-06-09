import { env } from '../config/env.js';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const verifyTurnstileToken = async (token, remoteip) => {
  if (!env.turnstileEnabled || !env.turnstileSecretKey) {
    return { success: true, skipped: true };
  }

  const form = new URLSearchParams({
    secret: env.turnstileSecretKey,
    response: String(token || ''),
    ...(remoteip ? { remoteip } : {})
  });

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  });

  const data = await response.json().catch(() => ({}));
  return {
    success: Boolean(data?.success),
    data
  };
};
