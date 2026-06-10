import { Switch } from './ui';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' }
];

const DEFAULT_OPEN = '09:00';
const DEFAULT_CLOSE = '17:00';

/**
 * Per-day business hours editor (Frontend Roadmap F5.6).
 * `value` is the API shape: { mon: { open, close } | null, ... }.
 * A day with a null/absent entry is closed.
 */
export default function BusinessHoursEditor({ value = {}, onChange }) {
  const setDay = (key, next) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const day = value?.[key] || null;
        const open = Boolean(day);
        return (
          <div key={key} className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-750 bg-neutral-900/40 px-3 py-2">
            <span className="w-24 shrink-0 text-sm font-medium text-neutral-200">{label}</span>
            <div className="w-28 shrink-0">
              <Switch
                checked={open}
                onChange={(checked) => setDay(key, checked ? { open: DEFAULT_OPEN, close: DEFAULT_CLOSE } : null)}
                label={open ? 'Open' : 'Closed'}
              />
            </div>
            {open ? (
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => setDay(key, { ...day, open: e.target.value })}
                  aria-label={`${label} opening time`}
                  className="rounded-md border border-neutral-750 bg-neutral-800 px-2 py-1 text-neutral-100"
                />
                <span className="text-neutral-500">to</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => setDay(key, { ...day, close: e.target.value })}
                  aria-label={`${label} closing time`}
                  className="rounded-md border border-neutral-750 bg-neutral-800 px-2 py-1 text-neutral-100"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
