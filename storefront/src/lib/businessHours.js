/**
 * Business-hours helpers for the storefront "open now" indicator
 * (Frontend Roadmap F5.6).
 *
 * `business_hours` shape (from the API): { mon: { open, close } | null, ... }
 * where open/close are 24h "HH:MM" strings in the shop's local time.
 * A null/absent day means closed. Overnight ranges (close <= open) are
 * supported (e.g. open 18:00, close 02:00).
 *
 * Note: "now" is evaluated against the visitor's local clock — the shop's
 * timezone is not stored, so this is an approximation.
 */
const ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday'
};

const toMinutes = (value) => {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const to12h = (value) => {
  const mins = toMinutes(value);
  if (mins === null) return value;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

export function hasBusinessHours(hours) {
  return Boolean(hours && ORDER.some((key) => hours[key]));
}

/**
 * Returns { isOpen, todayKey, todayLabel, todayRange } for the given hours.
 * `now` is injectable for testing; defaults to the current local time.
 */
export function getOpenState(hours, now = new Date()) {
  if (!hasBusinessHours(hours)) {
    return { isOpen: false, todayKey: null, todayLabel: '', todayRange: '' };
  }

  const todayKey = ORDER[now.getDay()];
  const today = hours[todayKey] || null;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let isOpen = false;
  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (open !== null && close !== null) {
      isOpen = close <= open
        ? nowMinutes >= open || nowMinutes < close // overnight
        : nowMinutes >= open && nowMinutes < close;
    }
  }

  // Also honor an overnight range that started yesterday.
  if (!isOpen) {
    const yKey = ORDER[(now.getDay() + 6) % 7];
    const yesterday = hours[yKey] || null;
    if (yesterday) {
      const open = toMinutes(yesterday.open);
      const close = toMinutes(yesterday.close);
      if (open !== null && close !== null && close <= open && nowMinutes < close) {
        isOpen = true;
      }
    }
  }

  return {
    isOpen,
    todayKey,
    todayLabel: LABELS[todayKey],
    todayRange: today ? `${to12h(today.open)} – ${to12h(today.close)}` : 'Closed'
  };
}

/** Ordered Monday-first list of { key, label, range } for display. */
export function listBusinessHours(hours) {
  const weekOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return weekOrder.map((key) => {
    const day = hours?.[key] || null;
    return {
      key,
      label: LABELS[key],
      range: day ? `${to12h(day.open)} – ${to12h(day.close)}` : 'Closed'
    };
  });
}
