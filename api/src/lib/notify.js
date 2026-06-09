import { env } from '../config/env.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

const buildHtml = (title, payload) => `
  <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111">
    <h2 style="margin-bottom:8px">${title}</h2>
    <p style="margin-top:0">Arkived notification event payload:</p>
    <pre style="background:#f6f8fa;padding:12px;border-radius:8px;overflow:auto">${JSON.stringify(payload, null, 2)}</pre>
  </div>
`;

const resolveRecipient = (payload) => {
  if (env.resendTestMode) {
    return env.resendDevInbox;
  }
  return payload?.to || env.resendDevInbox;
};

const canSend = () => env.resendEnabled && Boolean(env.resendApiKey);

const send = async (kind, subject, payload) => {
  const to = resolveRecipient(payload);
  const requestBody = {
    from: env.resendFrom,
    to: [to],
    subject,
    html: buildHtml(subject, payload),
    tags: [{ name: 'event', value: kind }]
  };

  if (env.resendReplyTo) {
    requestBody.reply_to = env.resendReplyTo;
  }

  if (!canSend()) {
    console.info(`[notify:${kind}] skipped (RESEND disabled or missing key)`, { to, payload });
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error(`[notify:${kind}] resend error`, { status: response.status, data });
      return { ok: false, error: data?.message || 'RESEND_REQUEST_FAILED' };
    }

    console.info(`[notify:${kind}] sent`, { id: data?.id, to, subject });
    return { ok: true, id: data?.id || null };
  } catch (error) {
    console.error(`[notify:${kind}] failed`, error);
    return { ok: false, error: error?.message || 'RESEND_NETWORK_ERROR' };
  }
};

export const notify = {
  async bookingStatusChanged(payload) {
    const previous = payload?.previous_status || 'unknown';
    const next = payload?.next_status || 'unknown';
    return send('booking-status', `Booking status changed: ${previous} -> ${next}`, payload);
  },

  async maintenanceDue(payload) {
    return send('maintenance-due', 'Maintenance due reminder', payload);
  },

  async bookingReminder(payload) {
    const type = payload?.type || 'booking-reminder';
    return send('booking-reminder', `Booking reminder: ${type}`, payload);
  }
};
