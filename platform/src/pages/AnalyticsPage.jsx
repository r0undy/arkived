import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';

const DAY_MS = 24 * 60 * 60 * 1000;
const toYmd = (value) => new Date(value).toISOString().slice(0, 10);
const addDays = (date, days) => new Date(new Date(date).getTime() + days * DAY_MS);

const presetRange = (days) => {
  const end = new Date();
  const start = addDays(end, -(days - 1));
  return { start: toYmd(start), end: toYmd(end) };
};

export default function AnalyticsPage() {
  const [range, setRange] = useState(() => presetRange(30));
  const [customRange, setCustomRange] = useState(() => presetRange(30));
  const [activePreset, setActivePreset] = useState('30d');
  const [loading, setLoading] = useState(false);

  const [revenue, setRevenue] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [topEquipment, setTopEquipment] = useState([]);
  const [bookingVolume, setBookingVolume] = useState([]);
  const [averageDuration, setAverageDuration] = useState(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [revenueResult, categoryResult, topEquipmentResult, bookingVolumeResult, calendarResult] = await Promise.all([
          api.analyticsRevenue(),
          api.analyticsRevenueByCategory(),
          api.analyticsTopEquipment(),
          api.analyticsBookingVolume({ granularity: 'week', start: range.start, end: range.end }),
          api.bookingsCalendar({ start: range.start, end: range.end })
        ]);

        setRevenue(revenueResult.data || []);
        setRevenueByCategory(categoryResult.data || []);
        setTopEquipment(topEquipmentResult.data || []);
        setBookingVolume(bookingVolumeResult.data || []);

        const durations = (calendarResult.data || []).map((entry) => {
          const start = new Date(`${entry.start_date}T00:00:00Z`);
          const end = new Date(`${entry.end_date}T00:00:00Z`);
          return Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1);
        });
        const avg = durations.length === 0
          ? 0
          : durations.reduce((sum, value) => sum + value, 0) / durations.length;
        setAverageDuration(avg);
      } catch (_error) {
        setRevenue([]);
        setRevenueByCategory([]);
        setTopEquipment([]);
        setBookingVolume([]);
        setAverageDuration(0);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [range.start, range.end]);

  const maxRevenue = useMemo(
    () => Math.max(1, ...revenue.map((entry) => Number(entry.revenue || 0))),
    [revenue]
  );

  const totalCategoryRevenue = useMemo(
    () => revenueByCategory.reduce((sum, entry) => sum + Number(entry.revenue || 0), 0),
    [revenueByCategory]
  );

  const linePoints = useMemo(() => {
    if (bookingVolume.length === 0) return '';
    const max = Math.max(1, ...bookingVolume.map((entry) => Number(entry.count || 0)));
    return bookingVolume
      .map((entry, index) => {
        const x = bookingVolume.length === 1 ? 0 : (index / (bookingVolume.length - 1)) * 100;
        const y = 100 - (Number(entry.count || 0) / max) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }, [bookingVolume]);

  const applyPreset = (label, days) => {
    const next = presetRange(days);
    setActivePreset(label);
    setRange(next);
    setCustomRange(next);
  };

  const applyCustom = () => {
    if (!customRange.start || !customRange.end || customRange.start > customRange.end) return;
    setActivePreset('custom');
    setRange(customRange);
  };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Revenue, demand, and utilization performance." />

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Date Range</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Preset active={activePreset === '7d'} label="7d" onClick={() => applyPreset('7d', 7)} />
          <Preset active={activePreset === '30d'} label="30d" onClick={() => applyPreset('30d', 30)} />
          <Preset active={activePreset === '90d'} label="90d" onClick={() => applyPreset('90d', 90)} />

          <label className="ml-3 text-sm text-neutral-200">
            Start
            <input
              className="ml-2 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1"
              onChange={(event) => setCustomRange((prev) => ({ ...prev, start: event.target.value }))}
              type="date"
              value={customRange.start}
            />
          </label>
          <label className="text-sm text-neutral-200">
            End
            <input
              className="ml-2 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1"
              onChange={(event) => setCustomRange((prev) => ({ ...prev, end: event.target.value }))}
              type="date"
              value={customRange.end}
            />
          </label>
          <button className="rounded-md border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900" onClick={applyCustom} type="button">
            Apply Custom
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-750 bg-neutral-800 p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">Monthly Revenue</h2>
          <div className="mt-4 grid grid-cols-12 items-end gap-2">
            {revenue.map((entry) => {
              const value = Number(entry.revenue || 0);
              const height = Math.max(8, Math.round((value / maxRevenue) * 140));
              return (
                <div key={entry.month} className="flex flex-col items-center">
                  <div className="w-full rounded-t bg-brand-500/70" style={{ height }} title={`PHP ${value.toLocaleString()}`} />
                  <span className="mt-1 text-[10px] text-neutral-400">{entry.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-750 bg-neutral-800 p-4">
          <h2 className="text-lg font-semibold tracking-tight">Average Rental Duration</h2>
          <p className="mt-6 text-4xl font-bold">{averageDuration.toFixed(1)} <span className="text-base font-medium text-neutral-400">days</span></p>
          <p className="mt-2 text-xs text-neutral-400">Based on bookings overlapping the selected range.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-750 bg-neutral-800 p-4">
          <h2 className="text-lg font-semibold tracking-tight">Revenue by Category</h2>
          <div className="mt-4 space-y-2">
            {revenueByCategory.map((entry) => {
              const value = Number(entry.revenue || 0);
              const width = totalCategoryRevenue === 0 ? 0 : (value / totalCategoryRevenue) * 100;
              return (
                <div key={entry.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{entry.category}</span>
                    <span>PHP {value.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-neutral-900">
                    <div className="h-full rounded bg-brand-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
            {revenueByCategory.length === 0 ? <p className="text-sm text-neutral-400">No category revenue data.</p> : null}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-750 bg-neutral-800 p-4">
          <h2 className="text-lg font-semibold tracking-tight">Top 10 Performing Assets</h2>
          <div className="mt-3 space-y-2">
            {topEquipment.map((entry, index) => (
              <div key={entry.equipment_id} className="flex items-center justify-between rounded-md border border-neutral-750 bg-neutral-900 px-3 py-2 text-sm">
                <span>{index + 1}. {entry.equipment_name}</span>
                <span>PHP {Number(entry.revenue || 0).toLocaleString()}</span>
              </div>
            ))}
            {topEquipment.length === 0 ? <p className="text-sm text-neutral-400">No top-performing assets yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Booking Volume Trend</h2>
        <div className="mt-4 rounded-md border border-neutral-750 bg-neutral-900 p-3">
          <svg className="h-40 w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polyline
              fill="none"
              points={linePoints}
              stroke="rgb(59 130 246)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-400">
            {bookingVolume.map((entry) => (
              <span key={entry.period} className="rounded-md bg-neutral-800 px-2 py-1">
                {entry.period}: {entry.count}
              </span>
            ))}
          </div>
          {bookingVolume.length === 0 ? <p className="mt-2 text-sm text-neutral-400">No booking volume data.</p> : null}
        </div>
      </section>

      {loading ? <p className="mt-4 text-sm text-neutral-400">Refreshing analytics…</p> : null}
    </div>
  );
}

function Preset({ active, label, onClick }) {
  return (
    <button
      className={`rounded-md px-3 py-2 text-sm ${active ? 'bg-brand-500 text-white' : 'border border-neutral-700 hover:bg-neutral-900'}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
