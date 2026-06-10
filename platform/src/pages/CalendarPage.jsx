import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';

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
  reserved: 'bg-warning-500/20 text-warning-200 border-warning-500/40',
  rented: 'bg-danger-500/20 text-danger-200 border-danger-500/40',
  available: 'bg-success-500/20 text-success-200 border-success-500/40',
  maintenance: 'bg-blue-500/20 text-blue-200 border-blue-500/40'
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

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <FilterSelect
            label="Equipment"
            value={filters.equipment_id}
            onChange={(event) => setFilters((prev) => ({ ...prev, equipment_id: event.target.value }))}
          >
            <option value="">All</option>
            {equipment.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </FilterSelect>
          <FilterSelect
            label="Category"
            value={filters.category}
            onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value, equipment_id: '' }))}
          >
            <option value="">All</option>
            {categories.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </FilterSelect>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-md border border-neutral-700 px-3 py-2 text-sm" onClick={prev} type="button">Prev</button>
          <button className="rounded-md border border-neutral-700 px-3 py-2 text-sm" onClick={today} type="button">Today</button>
          <button className="rounded-md border border-neutral-700 px-3 py-2 text-sm" onClick={next} type="button">Next</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {VIEW_OPTIONS.map((entry) => (
          <button
            key={entry}
            className={`rounded-md px-3 py-1 text-sm capitalize ${view === entry ? 'bg-brand-500 text-white' : 'border border-neutral-700 text-neutral-300'}`}
            onClick={() => setView(entry)}
            type="button"
          >
            {entry}
          </button>
        ))}
        <span className="ml-2 text-sm text-neutral-300">{title}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <LegendItem className={colorClassByType.available} label="Available" />
        <LegendItem className={colorClassByType.rented} label="Rented" />
        <LegendItem className={colorClassByType.reserved} label="Reserved" />
        <LegendItem className={colorClassByType.maintenance} label="In Maintenance" />
      </div>

      {view === 'day' ? (
        <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
          <h2 className="text-sm font-semibold text-neutral-200">{formatLong(toYmd(range.start))}</h2>
          <div className="mt-3 grid gap-2">
            {(eventsByDate.get(toYmd(range.start)) || []).map((event) => (
              <EventButton
                key={event.id}
                event={event}
                equipment={equipmentById[event.equipment_id]}
                onClick={() => setSelected(event)}
              />
            ))}
            {(eventsByDate.get(toYmd(range.start)) || []).length === 0 ? (
              <p className="text-sm text-neutral-400">No events for this day.</p>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="mt-6 overflow-x-auto rounded-lg border border-neutral-750 bg-neutral-800">
          {view === 'month' ? (
            <div className="grid min-w-225 grid-cols-7 border-b border-neutral-750">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                <div key={label} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">
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
              return (
                <div
                  key={ymd}
                  className={`min-h-35 border-r border-b border-neutral-750 p-2 last:border-r-0 ${
                    outsideMonth ? 'bg-neutral-900/40' : ''
                  } ${isToday ? 'bg-brand-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${outsideMonth ? 'text-neutral-600' : 'text-neutral-400'}`}>
                      {day.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'UTC' })}
                    </p>
                    {isToday ? (
                      <span className="inline-flex items-center rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">
                        Today
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 grid gap-1">
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
                      <span className="px-1 text-[10px] font-medium text-neutral-400">+{dayEvents.length - 4} more</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {selected ? (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md animate-[modalIn_0.2s_ease-out] border-l border-neutral-750 bg-neutral-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight">Event Detail</h3>
              <button className="rounded-md border border-neutral-700 px-2 py-1 text-xs" onClick={() => setSelected(null)} type="button">
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <Row label="Type" value={selected.type} />
              <Row label="Status" value={selected.status} />
              <Row label="Equipment" value={equipmentById[selected.equipment_id]?.name || selected.equipment_id} />
              <Row label="Start" value={selected.start_date} />
              <Row label="End" value={selected.end_date} />
            </div>

            {selected.booking_id ? (
              <Link
                className="mt-5 inline-block rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold hover:bg-brand-600"
                to={`/dashboard/bookings/${selected.booking_id}`}
              >
                Open booking detail
              </Link>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({ label, children, ...props }) {
  return (
    <label className="block text-sm text-neutral-200">
      <span>{label}</span>
      <select className="mt-1 rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2" {...props}>
        {children}
      </select>
    </label>
  );
}

function LegendItem({ className, label }) {
  return <span className={`rounded border px-2 py-1 ${className}`}>{label}</span>;
}

function Row({ label, value }) {
  return (
    <div className="rounded-md border border-neutral-750 bg-neutral-800 p-3">
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-neutral-100">{value || '--'}</p>
    </div>
  );
}

function EventButton({ event, equipment, compact = false, onClick }) {
  return (
    <button
      className={`w-full rounded border px-2 py-1 text-left ${colorClassByType[event.type] || colorClassByType.reserved}`}
      onClick={onClick}
      type="button"
    >
      <p className={compact ? 'text-[11px] font-medium' : 'text-xs font-semibold'}>
        {equipment?.name || event.equipment_id}
      </p>
      <p className={compact ? 'text-[10px] opacity-90' : 'text-xs opacity-90'}>
        {event.title}
      </p>
    </button>
  );
}
