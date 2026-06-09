import { env } from '../config/env.js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const TWILIO_API_URL = (accountSid) => `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

const buildHtml = (title, payload) => `
  <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111">
    <h2 style="margin-bottom:8px">${title}</h2>
    <p style="margin-top:0">Arkived notification event payload:</p>
    <pre style="background:#f6f8fa;padding:12px;border-radius:8px;overflow:auto">${JSON.stringify(payload, null, 2)}</pre>
  </div>
`;

const resolveRecipient = (payload) => {
  if (env.resendTestMode) {
    return payload?.to || env.resendDevInbox;
  }
  return payload?.to || env.resendAdminInbox || env.resendDevInbox;
};

const canSend = () => env.resendEnabled && Boolean(env.resendApiKey);
const canSendSms = () => env.twilioEnabled
  && Boolean(env.twilioAccountSid)
  && Boolean(env.twilioAuthToken)
  && Boolean(env.twilioFrom);

const sendSms = async (kind, subject, payload) => {
  const recipients = Array.isArray(payload?.sms_to) && payload.sms_to.length > 0
    ? payload.sms_to
    : env.twilioSmsTo;

  if (recipients.length === 0 || !canSendSms()) {
    console.info(`[notify:${kind}] sms skipped`, { recipients });
    return { ok: false, skipped: true };
  }

  const auth = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString('base64');
  const body = `[Arkived] ${subject} (${JSON.stringify(payload)})`;

  try {
    const results = await Promise.all(recipients.map(async (to) => {
      const form = new URLSearchParams({
        From: env.twilioFrom,
        To: to,
        Body: body
      });

      const response = await fetch(TWILIO_API_URL(env.twilioAccountSid), {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form.toString()
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error(`[notify:${kind}] twilio error`, { status: response.status, data, to });
        return { ok: false, to };
      }

      console.info(`[notify:${kind}] sms sent`, { sid: data?.sid || null, to });
      return { ok: true, to, sid: data?.sid || null };
    }));

    return { ok: results.some((entry) => entry.ok), results };
  } catch (error) {
    console.error(`[notify:${kind}] twilio failed`, error);
    return { ok: false, error: error?.message || 'TWILIO_NETWORK_ERROR' };
  }
};

const send = async (kind, subject, payload, options = {}) => {
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
    if (options.sendSms) {
      await sendSms(kind, subject, payload);
    }
    return { ok: false, skipped: true, email: false };
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
      if (options.sendSms) {
        await sendSms(kind, subject, payload);
      }
      return { ok: false, error: data?.message || 'RESEND_REQUEST_FAILED', email: false };
    }

    console.info(`[notify:${kind}] sent`, { id: data?.id, to, subject });
    const sms = options.sendSms ? await sendSms(kind, subject, payload) : null;
    return { ok: true, id: data?.id || null, email: true, sms };
  } catch (error) {
    console.error(`[notify:${kind}] failed`, error);
    const sms = options.sendSms ? await sendSms(kind, subject, payload) : null;
    return { ok: false, error: error?.message || 'RESEND_NETWORK_ERROR', email: false, sms };
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
    const smsTypes = new Set(['overdue_day1_customer', 'overdue_day1_staff']);
    return send('booking-reminder', `Booking reminder: ${type}`, payload, {
      sendSms: smsTypes.has(type)
    });
  }
};
