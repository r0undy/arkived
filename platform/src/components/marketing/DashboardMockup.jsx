import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, CalendarCheck, Palette } from 'lucide-react';

const VIEWS = [
  {
    key: 'dashboard',
    icon: LayoutDashboard,
    label: 'Overview',
    render: () => (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Revenue', value: '₱128k' },
            { label: 'Active rentals', value: '24' },
            { label: 'Utilization', value: '86%' }
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-neutral-750 bg-neutral-900/60 p-2.5">
              <p className="text-[10px] text-neutral-400">{kpi.label}</p>
              <p className="mt-1 text-sm font-semibold text-neutral-50 tabular-nums">{kpi.value}</p>
            </div>
          ))}
        </div>
        <div className="flex h-24 items-end gap-1.5 rounded-lg border border-neutral-750 bg-neutral-900/60 p-3">
          {[40, 62, 48, 78, 56, 88, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 origin-bottom rounded-sm bg-brand-500/80 motion-safe:animate-[barGrow_0.6s_ease-out]"
              style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
    )
  },
  {
    key: 'equipment',
    icon: Package,
    label: 'Equipment',
    render: () => (
      <div className="space-y-2">
        {[
          { name: 'Canon EOS R5', tag: 'Available', tone: 'text-success-500' },
          { name: 'DJI RS 3 Gimbal', tag: 'On rent', tone: 'text-info-500' },
          { name: 'Aputure 600d', tag: 'Maintenance', tone: 'text-warning-500' },
          { name: 'Sennheiser MKH 416', tag: 'Available', tone: 'text-success-500' }
        ].map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-lg border border-neutral-750 bg-neutral-900/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-md bg-neutral-750" />
              <span className="text-xs font-medium text-neutral-100">{row.name}</span>
            </div>
            <span className={`text-[10px] font-semibold ${row.tone}`}>{row.tag}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    key: 'bookings',
    icon: CalendarCheck,
    label: 'Bookings',
    render: () => (
      <div className="space-y-2">
        {[
          { ref: '#A1B2C3', stage: 'reserved', pct: 20 },
          { ref: '#D4E5F6', stage: 'dispatched', pct: 60 },
          { ref: '#7G8H9I', stage: 'inspected', pct: 85 }
        ].map((b) => (
          <div key={b.ref} className="rounded-lg border border-neutral-750 bg-neutral-900/60 px-3 py-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono text-neutral-200">{b.ref}</span>
              <span className="capitalize text-neutral-400">{b.stage}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-750">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    key: 'branding',
    icon: Palette,
    label: 'Branding',
    render: () => (
      <div className="space-y-3">
        <div className="h-20 rounded-lg bg-[linear-gradient(120deg,#6366f1,#0ea5e9,#10b981,#6366f1)] bg-size-[300%_300%] motion-safe:animate-[auroraShift_6s_ease-in-out_infinite]" />
        <div className="flex gap-2">
          {['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'].map((c) => (
            <span key={c} className="h-6 w-6 rounded-full ring-2 ring-neutral-800" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 rounded bg-neutral-750" />
          <div className="h-2 w-1/2 rounded bg-neutral-750" />
        </div>
      </div>
    )
  }
];

/**
 * Self-contained animated product mockup for the marketing landing page.
 * Cycles through dashboard views inside a faux browser chrome. The auto-cycle
 * and decorative motion respect prefers-reduced-motion.
 */
export default function DashboardMockup() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const id = window.setInterval(() => setActive((prev) => (prev + 1) % VIEWS.length), 3200);
    return () => window.clearInterval(id);
  }, []);

  const view = VIEWS[active];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-neutral-750 bg-neutral-800 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-neutral-750 bg-neutral-900 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-success-500/80" />
        <div className="ml-3 flex-1 truncate rounded-md bg-neutral-800 px-3 py-1 text-[11px] text-neutral-400">
          app.arkived.dev/dashboard
        </div>
      </div>

      <div className="grid grid-cols-[88px_1fr]">
        {/* Faux sidebar */}
        <div className="border-r border-neutral-750 bg-neutral-900/40 p-2">
          {VIEWS.map((v, index) => {
            const Icon = v.icon;
            const isActive = index === active;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setActive(index)}
                aria-label={v.label}
                aria-pressed={isActive}
                className={`mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium transition ${
                  isActive ? 'bg-brand-500 text-white' : 'text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{v.label}</span>
              </button>
            );
          })}
        </div>

        {/* View body */}
        <div key={view.key} className="min-h-50 p-4 motion-safe:animate-[fadeIn_0.4s_ease-out]">
          <p className="mb-3 text-xs font-semibold text-neutral-300">{view.label}</p>
          {view.render()}
        </div>
      </div>
    </div>
  );
}
