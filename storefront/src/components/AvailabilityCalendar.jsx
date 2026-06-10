import { useMemo } from 'react';

/**
 * Friendly month-grid availability view for a storefront catalog item.
 * Renders the next `months` calendar months and shades days that fall inside a
 * blocked (booked) range, so visitors can scan availability at a glance instead
 * of reading a list of date ranges.
 *
 * @param {{ start_date: string, end_date: string, status: string }[]} ranges
 */
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const parseYmd = (value) => {
  const [y, m, d] = String(value).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const fmtYmd = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function AvailabilityCalendar({ ranges = [], months = 3 }) {
  const blocked = useMemo(() => {
    const map = new Set();
    for (const range of ranges) {
      if (!range?.start_date || !range?.end_date) continue;
      let cursor = parseYmd(range.start_date);
      const end = parseYmd(range.end_date);
      let guard = 0;
      while (cursor <= end && guard < 400) {
        map.add(fmtYmd(cursor));
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
        guard += 1;
      }
    }
    return map;
  }, [ranges]);

  const grids = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayYmd = fmtYmd(today);
    const result = [];

    for (let offset = 0; offset < months; offset += 1) {
      const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const cells = [];

      for (let blank = 0; blank < first.getDay(); blank += 1) {
        cells.push(null);
      }
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(first.getFullYear(), first.getMonth(), day);
        const ymd = fmtYmd(date);
        cells.push({
          day,
          ymd,
          isPast: ymd < todayYmd,
          isToday: ymd === todayYmd,
          isBlocked: blocked.has(ymd)
        });
      }

      result.push({
        key: `${first.getFullYear()}-${first.getMonth()}`,
        label: `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`,
        cells
      });
    }

    return result;
  }, [blocked, months]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-slate-200 bg-white" aria-hidden="true" />
          Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-rose-100 ring-1 ring-inset ring-rose-200" aria-hidden="true" />
          Booked
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm ring-1 ring-inset ring-slate-900" aria-hidden="true" />
          Today
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {grids.map((grid) => (
          <div key={grid.key} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 text-center text-sm font-semibold text-slate-900">{grid.label}</p>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-slate-400">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday} className="py-1">{weekday}</span>
              ))}
            </div>
            <div className="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-xs">
              {grid.cells.map((cell, index) => {
                if (!cell) return <span key={`blank-${index}`} aria-hidden="true" />;

                const base = 'flex h-8 items-center justify-center rounded-md';
                let tone = 'text-slate-700';
                let title = `${cell.ymd} · Available`;

                if (cell.isPast) {
                  tone = 'text-slate-300';
                  title = `${cell.ymd}`;
                } else if (cell.isBlocked) {
                  tone = 'bg-rose-100 font-semibold text-rose-700';
                  title = `${cell.ymd} · Booked`;
                }

                const ring = cell.isToday ? ' ring-1 ring-inset ring-slate-900' : '';

                return (
                  <span key={cell.ymd} className={`${base} ${tone}${ring}`} title={title}>
                    {cell.day}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
