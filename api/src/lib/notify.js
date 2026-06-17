import { env } from '../config/env.js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const TWILIO_API_URL = (accountSid) => `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
const EMAIL_ADDRESS_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const NAME_EMAIL_PATTERN = /^[^<>]+<\s*[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+\s*>$/;
const HEX_COLOR_PATTERN = /^#([0-9a-f]{6})$/i;
const DEFAULT_RESEND_FROM = 'onboarding@resend.dev';
const DEFAULT_ACCENT_COLOR = '#6366f1';

const cleanEnvValue = (value) => String(value || '')
  .trim()
  .replace(/^['"`]+|['"`]+$/g, '');

const isValidEmailField = (value) => (
  EMAIL_ADDRESS_PATTERN.test(value)
  || NAME_EMAIL_PATTERN.test(value)
);

const resolveFrom = () => {
  const candidate = cleanEnvValue(env.resendFrom);
  if (isValidEmailField(candidate)) {
    return candidate;
  }

  console.warn('[notify] invalid RESEND_FROM, using fallback onboarding@resend.dev');
  return DEFAULT_RESEND_FROM;
};

const resolveReplyTo = () => {
  const candidate = cleanEnvValue(env.resendReplyTo);
  if (!candidate) {
    return '';
  }
  if (isValidEmailField(candidate)) {
    return candidate;
  }
  console.warn('[notify] invalid RESEND_REPLY_TO ignored');
  return '';
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizeAccentColor = (value) => (
  HEX_COLOR_PATTERN.test(String(value || '').trim())
    ? String(value).trim().toLowerCase()
    : DEFAULT_ACCENT_COLOR
);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex) => {
  const normalized = normalizeAccentColor(hex).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
};

const darken = (hex, amount = 0.16) => {
  const rgb = hexToRgb(hex);
  const ratio = clamp(1 - amount, 0, 1);
  const toHex = (value) => Math.round(value * ratio).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

const rgba = (hex, alpha = 1) => {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
};

const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(String(value || '').trim());

const formatDateLabel = (value) => {
  const iso = String(value || '').trim();
  if (!iso) return '—';
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

const toDetailRows = (entries) => entries
  .filter((entry) => entry.value !== undefined && entry.value !== null && String(entry.value).trim() !== '')
  .map((entry) => (
    `<tr>
      <td style="padding:8px 0;color:#64748b;font-size:13px;vertical-align:top;">${escapeHtml(entry.label)}</td>
      <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;text-align:right;vertical-align:top;">${escapeHtml(entry.value)}</td>
    </tr>`
  ))
  .join('');

const reminderMeta = {
  start_tomorrow: {
    heading: 'Your booking starts tomorrow',
    message: 'Please prepare for pickup or delivery to avoid delays.'
  },
  return_tomorrow: {
    heading: 'Your return is due tomorrow',
    message: 'A quick reminder so your return schedule stays on track.'
  },
  overdue_day1_customer: {
    heading: 'Your booking is now overdue',
    message: 'Please coordinate an immediate return or contact the rental team.'
  },
  overdue_day1_staff: {
    heading: 'Booking overdue (Day 1)',
    message: 'Customer follow-up is recommended today.'
  },
  overdue_day3_admin: {
    heading: 'Overdue escalation (Day 3)',
    message: 'This booking requires admin attention and escalation handling.'
  }
};

const buildReminderBody = (payload, accent) => {
  const type = payload?.type || 'booking-reminder';
  const meta = reminderMeta[type] || {
    heading: 'Booking reminder',
    message: 'Please review the booking details below.'
  };

  const detailRows = toDetailRows([
    { label: 'Booking ID', value: payload?.booking_id },
    { label: 'Customer', value: payload?.customer_name },
    { label: 'Equipment', value: payload?.equipment_name },
    { label: 'Start date', value: formatDateLabel(payload?.start_date) },
    { label: 'End date', value: formatDateLabel(payload?.end_date) },
    { label: 'Storefront', value: payload?.storefront_url }
  ]);

  const contactBits = [payload?.tenant_contact_email, payload?.tenant_contact_phone]
    .filter(Boolean)
    .join(' • ');

  const contactHtml = contactBits
    ? `<p style="margin:16px 0 0;color:#334155;font-size:13px;">Need help? Contact ${escapeHtml(payload?.tenant_name || 'the rental team')}: ${escapeHtml(contactBits)}</p>`
    : '';

  return `
    <p style="margin:0 0 10px;font-size:18px;line-height:1.35;font-weight:700;color:#0f172a;">${escapeHtml(meta.heading)}</p>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:#334155;">${escapeHtml(meta.message)}</p>
    <div style="border:1px solid ${rgba(accent, 0.24)};border-radius:12px;background:${rgba(accent, 0.06)};padding:14px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${detailRows || '<tr><td style="color:#64748b;font-size:13px;">No booking details available.</td></tr>'}
      </table>
    </div>
    ${contactHtml}
  `;
};

const buildGenericBody = (subject, payload) => {
  const rows = toDetailRows([
    { label: 'Event', value: subject },
    { label: 'Booking ID', value: payload?.booking_id },
    { label: 'Tenant ID', value: payload?.tenant_id },
    { label: 'Previous status', value: payload?.previous_status },
    { label: 'Next status', value: payload?.next_status },
    { label: 'Due date', value: payload?.due_date }
  ]);

  return `
    <p style="margin:0 0 14px;font-size:16px;line-height:1.4;font-weight:700;color:#0f172a;">${escapeHtml(subject)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      ${rows || '<tr><td style="color:#64748b;font-size:13px;">No additional details.</td></tr>'}
    </table>
  `;
};

export const renderNotificationHtml = (kind, subject, payload) => {
  const accent = normalizeAccentColor(payload?.tenant_accent_color);
  const accentDark = darken(accent, 0.2);
  const tenantName = escapeHtml(payload?.tenant_name || 'Arkived');
  const logoUrl = isHttpUrl(payload?.tenant_logo_url) ? payload.tenant_logo_url.trim() : '';
  const body = kind === 'booking-reminder'
    ? buildReminderBody(payload, accent)
    : buildGenericBody(subject, payload);

  const logoOrInitial = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${tenantName} logo" width="40" height="40" style="display:block;border-radius:10px;object-fit:contain;" />`
    : `<div style="width:40px;height:40px;border-radius:10px;background:${accent};color:#fff;font:700 16px/40px Inter,Arial,sans-serif;text-align:center;">${tenantName.charAt(0) || 'A'}</div>`;

  return `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;border-collapse:separate;">
      <tr>
        <td style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <div style="height:6px;background:linear-gradient(90deg, ${accent} 0%, ${accentDark} 100%);"></div>
          <div style="padding:20px 22px 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;">${logoOrInitial}</td>
                <td style="vertical-align:middle;padding-left:12px;">
                  <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">${tenantName}</p>
                  <p style="margin:2px 0 0;font-size:18px;font-weight:800;color:#0f172a;">${escapeHtml(subject)}</p>
                </td>
              </tr>
            </table>
            <div style="margin-top:18px;">${body}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 6px 0;color:#94a3b8;font-size:12px;text-align:center;">
          Sent by Arkived notifications
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

const buildText = (kind, subject, payload) => {
  if (kind === 'booking-reminder') {
    return [
      subject,
      '',
      payload?.tenant_name ? `Shop: ${payload.tenant_name}` : '',
      payload?.booking_id ? `Booking: ${payload.booking_id}` : '',
      payload?.equipment_name ? `Equipment: ${payload.equipment_name}` : '',
      payload?.start_date ? `Start: ${formatDateLabel(payload.start_date)}` : '',
      payload?.end_date ? `End: ${formatDateLabel(payload.end_date)}` : '',
      payload?.storefront_url ? `Storefront: ${payload.storefront_url}` : '',
      payload?.tenant_contact_email ? `Contact: ${payload.tenant_contact_email}` : ''
    ].filter(Boolean).join('\n');
  }

  return `${subject}\n\nBooking ID: ${payload?.booking_id || 'n/a'}\nTenant ID: ${payload?.tenant_id || 'n/a'}`;
};

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
  const from = resolveFrom();
  const replyTo = resolveReplyTo();
  const requestBody = {
    from,
    to: [to],
    subject,
    html: renderNotificationHtml(kind, subject, payload),
    text: buildText(kind, subject, payload),
    tags: [{ name: 'event', value: kind }]
  };

  if (replyTo) {
    requestBody.reply_to = replyTo;
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
    const subjectByType = {
      start_tomorrow: 'Booking reminder: your rental starts tomorrow',
      return_tomorrow: 'Booking reminder: your return is due tomorrow',
      overdue_day1_customer: 'Action required: your rental is overdue',
      overdue_day1_staff: 'Overdue alert: customer booking needs follow-up',
      overdue_day3_admin: 'Escalation alert: booking overdue (Day 3)'
    };
    return send('booking-reminder', subjectByType[type] || `Booking reminder: ${type}`, payload, {
      sendSms: smsTypes.has(type)
    });
  }
};
