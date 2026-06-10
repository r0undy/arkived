import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

const VIEW_OPTIONS = ['month', 'week', 'day'];
const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (value) => new Date(`${value}T00:00:00Z`);
const toYmd = (date) => new Date(date).toISOString().slice(0, 10);
const startOfDay = (date) => toDate(toYmd(date));
const endOfDay = (date) => startOfDay(new Date(startOfDay(date).getTime() + DAY_MS - 1));

const startOfWeek = (date) => {
  const day = startOfDay(date);
  const dow = day.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return new Date(day.getTime() + diff * DAY_MS);
};

const endOfWeek = (date) => new Date(startOfWeek(date).getTime() + 6 * DAY_MS);
const startOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const endOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

const shiftDate = (date, view, direction) => {
  if (view === 'day') return new Date(date.getTime() + direction * DAY_MS);
  if (view === 'week') return new Date(date.getTime() + direction * 7 * DAY_MS);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + direction, date.getUTCDate()));
};

const colorClassByType = {
  reserved: 'border-warning-500/30 bg-warning-500/10 text-warning-200',
  rented: 'border-danger-500/30 bg-danger-500/10 text-danger-200',
  available: 'border-success-500/30 bg-success-500/10 text-success-200',
  maintenance: 'border-blue-500/30 bg-blue-500/10 text-blue-200'
};

const dotByType = {
  reserved: 'bg-warning-500',
  rented: 'bg-danger-500',
  available: 'bg-success-500',
  maintenance: 'bg-blue-500'
};

const eventTypeFromStatus = (status) => {
  if (['reserved', 'payment'].includes(status)) return 'reserved';
  if (['dispatched', 'returned', 'inspected'].includes(status)) return 'rented';
  return 'available';
};

const visibleRange = (anchorDate, view) => {
  if (view === 'day') return { start: startOfDay(anchorDate), end: endOfDay(anchorDate) };
  if (view === 'week') return { start: startOfWeek(anchorDate), end: endOfWeek(anchorDate) };
  return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
};

const eachDay = (start, end) => {
  const out = [];
  let cursor = startOfDay(start);
  while (cursor <= end) {
    out.push(cursor);
    cursor = new Date(cursor.getTime() + DAY_MS);
  }
  return out;
};

const formatLong = (value) => new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

export default function CalendarPage() {
  const [view, setView] = useState('month');
  const [anchorDate, setAnchorDate] = useState(startOfDay(new Date()));
  const [filters, setFilters] = useState({ equipment_id: '', category: '' });
  const [equipment, setEquipment] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  const range = useMemo(() => visibleRange(anchorDate, view), [anchorDate, view]);

  useEffect(() => {
    api.equipment()
      .then((result) => setEquipment(result.data || []))
      .catch(() => setEquipment([]));
  }, []);

  useEffect(() => {
    const run = async () => {
      const selectedEquipment = equipment.filter((item) => {
        if (filters.equipment_id && item.id !== filters.equipment_id) return false;
        if (filters.category && item.category !== filters.category) return false;
        return true;
      });

      const equipmentIds = new Set(selectedEquipment.map((item) => item.id));
      try {
        const [calendarResult, maintenanceResults] = await Promise.all([
          api.bookingsCalendar({
            start: toYmd(range.start),
            end: toYmd(range.end),
            ...(filters.equipment_id ? { equipment_id: filters.equipment_id } : {})
          }),
          Promise.all(selectedEquipment.map((item) => api.maintenanceLogs(item.id).catch(() => ({ data: [] }))))
        ]);

        const bookingEvents = (calendarResult.data || [])
          .filter((entry) => equipmentIds.size === 0 || equipmentIds.has(entry.equipment_id))
          .map((entry) => ({
            id: `booking-${entry.id}`,
            booking_id: entry.id,
            equipment_id: entry.equipment_id,
            start_date: entry.start_date,
            end_date: entry.end_date,
            type: eventTypeFromStatus(entry.status),
            status: entry.status,
            title: `${entry.status} booking`
          }));

        const maintenanceEvents = maintenanceResults.flatMap((result, index) => {
          const item = selectedEquipment[index];
          return (result.data || [])
            .filter((log) => log.service_date >= toYmd(range.start) && log.service_date <= toYmd(range.end))
            .map((log) => ({
              id: `maintenance-${log.id}`,
              booking_id: null,
              equipment_id: item.id,
              start_date: log.service_date,
              end_date: log.service_date,
              type: 'maintenance',
              status: log.service_type,
              title: `maintenance: ${log.service_type}`
            }));
        });

        setEvents([...bookingEvents, ...maintenanceEvents]);
      } catch (_error) {
        setEvents([]);
      }
    };

    run();
  }, [range.start, range.end, filters.equipment_id, filters.category, equipment]);

  const equipmentById = useMemo(
    () => Object.fromEntries(equipment.map((item) => [item.id, item])),
    [equipment]
  );

  const categories = useMemo(
    () => Array.from(new Set(equipment.map((item) => item.category))).sort((a, b) => String(a).localeCompare(String(b))),
    [equipment]
  );

  const days = useMemo(() => eachDay(range.start, range.end), [range.start, range.end]);
  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const day of days) {
      map.set(toYmd(day), []);
    }
    for (const event of events) {
      const start = toDate(event.start_date);
      const end = toDate(event.end_date);
      for (const day of days) {
        if (day >= start && day <= end) {
          map.get(toYmd(day))?.push(event);
        }
      }
    }
    return map;
  }, [days, events]);

  const prev = () => setAnchorDate((value) => shiftDate(value, view, -1));
  const next = () => setAnchorDate((value) => shiftDate(value, view, 1));
  const today = () => setAnchorDate(startOfDay(new Date()));

  const title = useMemo(() => {
    if (view === 'day') return formatLong(toYmd(anchorDate));
    if (view === 'week') return `${formatLong(toYmd(range.start))} - ${formatLong(toYmd(range.end))}`;
    return anchorDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }, [view, anchorDate, range.start, range.end]);

  const weekDays = view === 'month'
    ? eachDay(startOfWeek(range.start), endOfWeek(range.end))
    : days;

  const todayYmd = toYmd(new Date());

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Month / week / day booking and maintenance visibility." />

      <div className="rounded-xl border border-neutral-750 bg-neutral-800/60 p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-lg border border-neutral-750 bg-neutral-900 p-1">
              <button
                aria-label="Previous period"
                className="rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
                onClick={prev}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                className="rounded-md px-2.5 py-1 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800 hover:text-white"
                onClick={today}
                type="button"
              >
                Today
              </button>
              <button
                aria-label="Next period"
                className="rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
                onClick={next}
                type="button"
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-100">{title}</p>
              <p className="text-xs capitalize text-neutral-500">{view} view</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-neutral-750 bg-neutral-900 p-1">
              {VIEW_OPTIONS.map((entry) => (
                <button
                  key={entry}
                  aria-pressed={view === entry}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                    view === entry
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-100'
                  }`}
                  onClick={() => setView(entry)}
                  type="button"
                >
                  {entry}
                </button>
              ))}
            </div>

            <FilterSelect
              label="Equipment"
              value={filters.equipment_id}
              onChange={(event) => setFilters((prev) => ({ ...prev, equipment_id: event.target.value }))}
            >
              <option value="">All equipment</option>
              {equipment.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FilterSelect>
            <FilterSelect
              label="Category"
              value={filters.category}
              onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value, equipment_id: '' }))}
            >
              <option value="">All categories</option>
              {categories.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </FilterSelect>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-750/60 pt-3 text-xs text-neutral-400">
          <span className="font-medium uppercase tracking-wide text-neutral-500">Legend</span>
          <LegendItem dot={dotByType.available} label="Available" />
          <LegendItem dot={dotByType.rented} label="Rented" />
          <LegendItem dot={dotByType.reserved} label="Reserved" />
          <LegendItem dot={dotByType.maintenance} label="In maintenance" />
        </div>
      </div>

      {view === 'day' ? (
        <section className="mt-4 rounded-xl border border-neutral-750 bg-neutral-800 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="h-4 w-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-neutral-100">{formatLong(toYmd(range.start))}</h2>
            <span className="ml-auto text-xs text-neutral-500">
              {(eventsByDate.get(toYmd(range.start)) || []).length} events
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(eventsByDate.get(toYmd(range.start)) || []).map((event) => (
              <EventButton
                key={event.id}
                event={event}
                equipment={equipmentById[event.equipment_id]}
                onClick={() => setSelected(event)}
              />
            ))}
            {(eventsByDate.get(toYmd(range.start)) || []).length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-750 py-12 text-center">
                <CalendarDays aria-hidden="true" className="h-6 w-6 text-neutral-600" />
                <p className="mt-2 text-sm text-neutral-400">No events scheduled for this day.</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="mt-4 overflow-hidden rounded-xl border border-neutral-750 bg-neutral-800 shadow-sm">
          <div className="overflow-x-auto">
            {view === 'month' ? (
              <div className="grid min-w-225 grid-cols-7 border-b border-neutral-750 bg-neutral-900/50">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                  <div key={label} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {label}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="grid min-w-225 grid-cols-7">
              {weekDays.map((day) => {
                const ymd = toYmd(day);
                const dayEvents = eventsByDate.get(ymd) || [];
                const isToday = ymd === todayYmd;
                const outsideMonth = view === 'month' && day.getUTCMonth() !== anchorDate.getUTCMonth();
                const weekdayShort = day.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' });
                return (
                  <div
                    key={ymd}
                    className={`min-h-32 border-r border-b border-neutral-750 p-1.5 transition-colors last:border-r-0 ${
                      outsideMonth ? 'bg-neutral-900/40' : 'hover:bg-neutral-750/30'
                    } ${isToday ? 'bg-brand-500/6' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between px-0.5">
                      <div className="flex items-baseline gap-1.5">
                        {view !== 'month' ? (
                          <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{weekdayShort}</span>
                        ) : null}
                        <span
                          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                            isToday
                              ? 'bg-brand-500 text-white'
                              : outsideMonth
                                ? 'text-neutral-600'
                                : 'text-neutral-300'
                          }`}
                        >
                          {day.getUTCDate()}
                        </span>
                      </div>
                      {dayEvents.length > 0 ? (
                        <span className="text-[10px] font-medium text-neutral-500">{dayEvents.length}</span>
                      ) : null}
                    </div>
                    <div className="grid gap-1">
                      {dayEvents.slice(0, 4).map((event) => (
                        <EventButton
                          key={`${event.id}-${ymd}`}
                          compact
                          event={event}
                          equipment={equipmentById[event.equipment_id]}
                          onClick={() => setSelected(event)}
                        />
                      ))}
                      {dayEvents.length > 4 ? (
                        <button
                          className="rounded px-1 py-0.5 text-left text-[10px] font-medium text-neutral-400 transition hover:text-neutral-100"
                          onClick={() => { setView('day'); setAnchorDate(startOfDay(day)); }}
                          type="button"
                        >
                          +{dayEvents.length - 4} more
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {selected ? (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md animate-[modalIn_0.2s_ease-out] border-l border-neutral-750 bg-neutral-900 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-800 p-5">
              <div className="flex items-center gap-3">
                <span className={`mt-0.5 h-9 w-1 shrink-0 rounded-full ${dotByType[selected.type] || dotByType.reserved}`} />
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-neutral-50">
                    {equipmentById[selected.equipment_id]?.name || selected.equipment_id}
                  </h3>
                  <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${colorClassByType[selected.type] || colorClassByType.reserved}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dotByType[selected.type] || dotByType.reserved}`} />
                    {selected.type}
                  </span>
                </div>
              </div>
              <button
                aria-label="Close"
                className="rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
                onClick={() => setSelected(null)}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 p-5 text-sm">
              <Row label="Status" value={selected.status} />
              <div className="grid grid-cols-2 gap-2">
                <Row label="Start" value={selected.start_date} />
                <Row label="End" value={selected.end_date} />
              </div>

              {selected.booking_id ? (
                <Button
                  as={Link}
                  className="mt-3 w-full"
                  to={`/dashboard/bookings/${selected.booking_id}`}
                >
                  Open booking detail
                </Button>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-neutral-750 px-3 py-2 text-center text-xs text-neutral-500">
                  Maintenance event — no booking attached.
                </p>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({ label, children, ...props }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-neutral-400">
      <span className="hidden sm:inline">{label}</span>
      <select
        aria-label={label}
        className="h-9 rounded-lg border border-neutral-750 bg-neutral-900 px-3 text-sm text-neutral-200 transition hover:border-neutral-700 focus:border-brand-500"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function LegendItem({ dot, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div className="rounded-lg border border-neutral-750 bg-neutral-800 p-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 capitalize text-neutral-100">{value || '--'}</p>
    </div>
  );
}

function EventButton({ event, equipment, compact = false, onClick }) {
  return (
    <button
      className={`flex w-full items-center gap-1.5 rounded-md border px-1.5 py-1 text-left transition hover:brightness-125 ${colorClassByType[event.type] || colorClassByType.reserved}`}
      onClick={onClick}
      type="button"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotByType[event.type] || dotByType.reserved}`} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-medium ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {equipment?.name || event.equipment_id}
        </span>
        {!compact ? <span className="block truncate text-xs capitalize opacity-80">{event.title}</span> : null}
      </span>
    </button>
  );
}
